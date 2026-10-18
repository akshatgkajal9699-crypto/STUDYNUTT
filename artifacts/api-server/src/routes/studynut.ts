import { clerkMiddleware, getAuth } from "@clerk/express";
import {
  CreateStudyActivityBody,
  CreateStudyActivityResponse,
  GetStudyActivitiesQueryParams,
  GetStudyActivitiesResponse,
  GetStudyDataResponse,
  SaveStudyDataBody,
  SaveStudyDataResponse,
} from "@workspace/api-zod";
import { db, studyActivitiesTable, studyUserDataTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";

const router: IRouter = Router();
const MAX_STUDY_DATA_BYTES = 500_000;
const MAX_ACTIVITY_DETAILS_BYTES = 80_000;

router.get("/studynut/data", clerkMiddleware(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to sync your study data." });
    return;
  }

  const [saved] = await db
    .select()
    .from(studyUserDataTable)
    .where(eq(studyUserDataTable.userId, userId))
    .limit(1);

  res.json(
    GetStudyDataResponse.parse({
      data: saved?.data ?? null,
      updatedAt: saved?.updatedAt.toISOString() ?? null,
    }),
  );
});

router.put("/studynut/data", clerkMiddleware(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to sync your study data." });
    return;
  }

  const parsed = SaveStudyDataBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Study data is invalid. Please refresh and try again." });
    return;
  }
  if (Buffer.byteLength(JSON.stringify(parsed.data.data), "utf8") > MAX_STUDY_DATA_BYTES) {
    res.status(400).json({ error: "Study data is too large to sync." });
    return;
  }

  const now = new Date();
  const [saved] = await db
    .insert(studyUserDataTable)
    .values({
      userId,
      data: parsed.data.data,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: studyUserDataTable.userId,
      set: {
        data: parsed.data.data,
        updatedAt: now,
      },
    })
    .returning();

  res.json(
    SaveStudyDataResponse.parse({
      data: saved.data,
      updatedAt: saved.updatedAt.toISOString(),
    }),
  );
});

router.get(
  "/studynut/activities",
  clerkMiddleware(),
  async (req, res): Promise<void> => {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Sign in to view saved activities." });
      return;
    }

    const parsed = GetStudyActivitiesQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Please request a valid activity page." });
      return;
    }

    const activities = await db
      .select()
      .from(studyActivitiesTable)
      .where(eq(studyActivitiesTable.userId, userId))
      .orderBy(desc(studyActivitiesTable.createdAt))
      .limit(parsed.data.limit);

    res.json(
      GetStudyActivitiesResponse.parse(
        activities.map((activity) => ({
          id: activity.id,
          kind: activity.kind,
          subject: activity.subject,
          title: activity.title,
          details: activity.details,
          createdAt: activity.createdAt.toISOString(),
        })),
      ),
    );
  },
);

router.post(
  "/studynut/activities",
  clerkMiddleware(),
  async (req, res): Promise<void> => {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Sign in to save this activity." });
      return;
    }

    const parsed = CreateStudyActivityBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "This activity could not be saved." });
      return;
    }
    if (
      Buffer.byteLength(JSON.stringify(parsed.data.details), "utf8") >
      MAX_ACTIVITY_DETAILS_BYTES
    ) {
      res.status(400).json({ error: "This activity is too large to save." });
      return;
    }

    const [created] = await db
      .insert(studyActivitiesTable)
      .values({
        userId,
        kind: parsed.data.kind,
        subject: parsed.data.subject,
        title: parsed.data.title,
        details: parsed.data.details,
      })
      .returning();

    res.status(201).json(
      CreateStudyActivityResponse.parse({
        id: created.id,
        kind: created.kind,
        subject: created.subject,
        title: created.title,
        details: created.details,
        createdAt: created.createdAt.toISOString(),
      }),
    );
  },
);

export default router;
