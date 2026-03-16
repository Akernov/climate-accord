import { z } from "zod";
import { Server, Socket } from "socket.io";
import { DB } from "../db.js";
import { withValidation, broadcastLobbyState, getSocketUser } from "../util.js";

export const generateBillsSchema = z.object({
  code: z.string(),
});

export function generateBills({ io, socket, db }: { io: Server, socket: Socket, db: DB }) {
    return withValidation(generateBillsSchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const game = await db.getGameByCode({ code: data.code });

        if (game?.host_user_id !== user.id) {
            throw new Error("Only the host can draw bills right now.");
        }

        
    });
}