import { Router } from "express";
import { authRouter } from "../routes/auth.routes.js";
import { employeeRouter } from "./employee.route.js";
import { userrouter } from "./user.routes.js";
import { BusinessAdvisorySBU } from "./BusinessAdvisory.routes.js";
import { LearningAndDevelopmentRouter } from "./LearningAndDevelopment.routes.js";
import { FleetRouter } from "./Fleet.routes.js";
import { CCIRouter } from "./CrystalChecksInternational.js";
import { UpcountryRouter } from "./Upcountry.js";
// import { profileRouter } from "./profile.route";
// import { dashboardRouter } from "./dashboard.route";
const rootRouter = Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/employee", employeeRouter);
rootRouter.use("/user", userrouter);
rootRouter.use("/BusinessAdvisorySBU", BusinessAdvisorySBU);
rootRouter.use("/LearningAndDevelopment", LearningAndDevelopmentRouter);
rootRouter.use("/Fleet", FleetRouter);
rootRouter.use("/CCI", CCIRouter);
rootRouter.use("/upcountry", UpcountryRouter);

export default rootRouter;
