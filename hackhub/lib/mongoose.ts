import mongoose from "mongoose";

const { MONGODB_URI = "" } = process.env;

if (!MONGODB_URI) {
	// Allow app to start; models will throw on first use if missing
}

let cachedConnection: typeof mongoose | null = null;

export async function connectMongo(): Promise<typeof mongoose> {
	if (cachedConnection && mongoose.connection.readyState === 1) {
		return cachedConnection;
	}
	await mongoose.connect(MONGODB_URI);
	cachedConnection = mongoose;
	return mongoose;
}



