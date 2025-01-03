import express, { Request, Response, Router } from "express"
import { loginUser, logoutUser, signupUser } from "../controllers/auth.controller";

const router: Router = express.Router()

router.post("/login", loginUser as express.RequestHandler)

router.post("/logout", logoutUser as express.RequestHandler)

router.post("/signup", signupUser as express.RequestHandler)

export default router