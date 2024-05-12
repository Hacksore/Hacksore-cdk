import { Construct } from "constructs";
import { aws_lightsail as lightsail } from "aws-cdk-lib";
import { readFileSync } from "fs";
import * as cdk from "aws-cdk-lib";

import "./env";

/**
 * This will create a script with the environment vars replaced
 * @returns A script with the creds embedded
 */
const createUserDataScript = () => {
  const rawUserDataScript = readFileSync("./bootstrap.sh", "utf8");

  return rawUserDataScript
    .replace("{DISCORD_TOKEN}", process.env.DISCORD_TOKEN)
    .replace("{FIREBASE_SA_BASE64}", process.env.FIREBASE_SA_BASE64)
    .replace("{GITHUB_ACCESS_TOKEN}", process.env.GITHUB_ACCESS_TOKEN);
};

export class DiscordPresenceStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const lightsailAZ = "us-east-1a";

    new lightsail.CfnInstance(this, "DiscordPresence", {
      blueprintId: "amazon_linux_2023",
      bundleId: "nano_ipv6_3_0",
      instanceName: "discord-presence",
      availabilityZone: lightsailAZ,
      userData: createUserDataScript(),
      networking: {
        ports: [
          {
            protocol: "tcp",
            fromPort: 22,
            toPort: 22,
            accessType: "PUBLIC",
            accessFrom: "::/0",
          },
        ],
      },
    });
  }
}
