import { Construct } from "constructs";
import { aws_ec2 as ec2, aws_iam as iam } from "aws-cdk-lib";
import { readFileSync } from "fs";
import * as cdk from "aws-cdk-lib";
import { Octokit } from "@octokit/core";

// this is only for deployment local
import "dotenv/config";
import { setRepoSecret } from "./util";

const { DISCORD_TOKEN, FIREBASE_SA_BASE64, GH_TOKEN } = process.env;

// github client
const octokit = new Octokit({ auth: GH_TOKEN });

export interface CdkProps {
  // Define construct properties here
}

if (!GH_TOKEN) throw new Error("GH_TOKEN env var must be set");
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

    this.createBotStack();
  }

  async createBotStack() {
    // default VPC
    const vpc = new ec2.Vpc(this, "DiscordPresenceVPC", {
      subnetConfiguration: [
        {
          cidrMask: 26,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // crreate a role
    const role = new iam.Role(this, "DiscordPresenceKeyPairRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    // security group
    const securityGroup = new ec2.SecurityGroup(this, "DiscordPresenceSG", {
      vpc,
      allowAllOutbound: true,
    });

    // add ssh port
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allows SSH access from Internet"
    );

    // Finally lets provision our ec2 instance
    const vmInstance = new ec2.Instance(this, "DiscordPresence", {
      vpc,
      role: role,
      securityGroup,
      instanceName: "DiscordPresence",
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyName: "DiscordPresenceKeyPair",
    });

    // add the init script
    vmInstance.addUserData(createUserDataScript());

    // store ip address
    new cdk.CfnOutput(this, "ipAddress", {
      value: vmInstance.instancePublicIp,
    });

    // set IP as a action secret
    await setRepoSecret("BOT_HOST_IP", vmInstance.instancePublicIp);

    // TODO: seems like limitation of the CDK/CF you cant get priv key
    // await setRepoSecret("BOT_HOST_PRIVATE_KEY", keyPair.);
  }
}
