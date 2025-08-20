import Pusher from "pusher";

const { PUSHER_APP_ID = "", PUSHER_KEY = "", PUSHER_SECRET = "", PUSHER_CLUSTER = "" } = process.env;

let pusherInstance: Pusher | null = null;

export function getPusher(): Pusher {
	if (!pusherInstance) {
		pusherInstance = new Pusher({
			appId: PUSHER_APP_ID,
			key: PUSHER_KEY,
			secret: PUSHER_SECRET,
			cluster: PUSHER_CLUSTER,
			useTLS: true,
		});
	}
	return pusherInstance;
}

export async function publish(channel: string, event: string, data: unknown) {
	const pusher = getPusher();
	await pusher.trigger(channel, event, data);
}



