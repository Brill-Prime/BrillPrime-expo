import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  firebaseUid?: string;
}

export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const firebaseUid = req.headers['x-firebase-uid'] as string;
    
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized - No authentication token provided', success: false });
    }

    const user = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
    
    if (!user.length) {
      return res.status(404).json({ error: 'User not found', success: false });
    }

    req.userId = user[0].id;
    req.firebaseUid = firebaseUid;
    next();
  } catch (error: any) {
    return res.status(500).json({ error: 'Authentication error', success: false });
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const firebaseUid = req.headers['x-firebase-uid'] as string;
  
  if (firebaseUid) {
    db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1)
      .then(user => {
        if (user.length) {
          req.userId = user[0].id;
          req.firebaseUid = firebaseUid;
        }
        next();
      })
      .catch(() => next());
  } else {
    next();
  }
}
