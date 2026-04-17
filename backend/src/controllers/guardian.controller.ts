import { Request, Response } from "express";
import {
  linkDependentService,
  suspendService,
  lockFinanceService
} from "../services/guardian.service";

export const linkDependent = async (req: Request, res: Response) => {
  const result = await linkDependentService(req.body);
  res.json(result);
};

export const suspendUser = async (req: Request, res: Response) => {
  const result = await suspendService(req.body);
  res.json(result);
};

export const lockFinance = async (req: Request, res: Response) => {
  const result = await lockFinanceService(req.body);
  res.json(result);
};