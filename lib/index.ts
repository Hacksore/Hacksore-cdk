import { Construct } from "constructs";
import { aws_lightsail as lightsail } from "aws-cdk-lib";
import { readFileSync } from "fs";
import * as cdk from "aws-cdk-lib";

const { DISCORD_TOKEN, FIREBASE_SA_BASE64 } = process.env;

if (!DISCORD_TOKEN) throw new Error("DISCORD_TOKEN env var must be set");
if (!FIREBASE_SA_BASE64)
  throw new Error("FIREBASE_SA_BASE64 env var must be set");

/**
 * This will create a script with the environment vars replaced
 * @returns A script with the creds embedded
 */
const createUserDataScript = () => {
  const rawUserDataScript = readFileSync("./bootstrap.sh", "utf8");

  return rawUserDataScript
    .replace("{DISCORD_TOKEN}", DISCORD_TOKEN)
    .replace("{FIREBASE_SA_BASE64}", FIREBASE_SA_BASE64);
};

export class DiscordPresenceStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const lightsailAZ = "us-east-1a";

    new lightsail.CfnInstance(this, "DiscordPresence", {
      blueprintId: "amazon_linux_2",
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
