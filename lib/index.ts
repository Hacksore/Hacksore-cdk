import { Construct } from "constructs";
import { aws_lightsail as lightsail } from "aws-cdk-lib";
import { readFileSync } from "fs";
import * as cdk from "aws-cdk-lib";
import "dotenv/config";

export interface CdkProps {
  // Define construct properties here
}

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
  constructor(scope: Construct, id: string, props: CdkProps = {}) {
    super(scope, id);

    const lightsailAZ = "us-east-1a";
    console.log(process.cwd());
    const vmInstance = new lightsail.CfnInstance(this, "DiscordPresence", {
      blueprintId: "amazon_linux_2",
      bundleId: "nano_2_0",
      instanceName: "discord-presence",
      availabilityZone: lightsailAZ,
      userData: createUserDataScript(),
    });

    // store ip address
    new cdk.CfnOutput(this, "ipAddress", {
      value: vmInstance.attrPublicIpAddress,
    });
  }
}
