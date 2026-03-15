import { z } from "zod";
import { Server, Socket } from "socket.io";
import { DB } from "../db.js"; 
import { withValidation } from "../util.js";

export const leaveLobbySchema = z.object({
  code: z.string(),
  playerName: z.string(),
});