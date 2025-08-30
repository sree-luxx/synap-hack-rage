import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import mongoose, { ConnectionStates } from "mongoose";
import { applyCors } from "./_cors";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (applyCors(req, res)) return;
	try {
		const health = {
			status: "healthy",
			timestamp: new Date().toISOString(),
			services: {
				api: "healthy",
				azureSql: "unknown",
				mongodb: "unknown",
			},
		};

		// Check Azure SQL connection (skip if no DATABASE_URL)
		if (process.env.DATABASE_URL) {
			try {
				await prisma.$queryRaw`SELECT 1`;
				health.services.azureSql = "healthy";
			} catch (error) {
				health.services.azureSql = "unavailable";
				health.status = "degraded";
			}
		} else {
			health.services.azureSql = "skipped";
		}

		// Check MongoDB connection (skip if no MONGODB_URI)
		if (process.env.MONGODB_URI) {
			try {
				// Try to establish connection if not connected
				if (mongoose.connection.readyState !== ConnectionStates.connected) {
					await mongoose.connect(process.env.MONGODB_URI);
				}

				if (mongoose.connection.readyState === ConnectionStates.connected) {
					health.services.mongodb = "healthy";
				} else {
					health.services.mongodb = "unavailable";
					health.status = "degraded";
				}
			} catch (error) {
				health.services.mongodb = "unavailable";
				health.status = "degraded";
			}
		} else {
			health.services.mongodb = "skipped";
		}

		res.status(200).json({ success: true, data: health });
	} catch (error: any) {
		res.status(500).json({
			success: false,
			message: "Health check failed",
			error: error.message,
		});
	}
}

