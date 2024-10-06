import { NextApiRequest, NextApiResponse } from "next";

const { initializeRAG } = require("./../rag/index.ts")

export default async function handler2(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
  return await initializeRAG()
  }
  