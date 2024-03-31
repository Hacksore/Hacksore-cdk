#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DiscordPresenceStack } from "../lib/index";

const app = new cdk.App();
new DiscordPresenceStack(app, "DiscordPresenceStack");
