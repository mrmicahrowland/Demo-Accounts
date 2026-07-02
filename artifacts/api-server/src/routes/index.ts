import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import estimatesRouter from "./estimates";
import invoicesRouter from "./invoices";
import jobsRouter from "./jobs";
import portfolioRouter from "./portfolio";
import faqRouter from "./faq";
import blogRouter from "./blog";
import newsletterRouter from "./newsletter";
import analyticsRouter from "./analytics";
import notificationsRouter from "./notifications";
import settingsRouter from "./settings";
import timeEntriesRouter from "./timeEntries";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(estimatesRouter);
router.use(invoicesRouter);
router.use(jobsRouter);
router.use(portfolioRouter);
router.use(faqRouter);
router.use(blogRouter);
router.use(newsletterRouter);
router.use(analyticsRouter);
router.use(notificationsRouter);
router.use(settingsRouter);
router.use(timeEntriesRouter);

export default router;
