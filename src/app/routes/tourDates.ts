import { Router } from "express";
import { TourDateModel, transformTourDate } from "../models/TourDate.js";
import { createCrudRouter } from "../utils/crudFactory.js";

const router = Router();

createCrudRouter(router, TourDateModel, transformTourDate, (body) => ({
	eventDate: body.eventDate,
	city: body.city,
	venue: body.venue,
	ticketUrl: body.ticketUrl,
	notes: body.notes,
	sortOrder: body.sortOrder,
}));

export default router;
