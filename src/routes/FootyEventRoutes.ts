import { Router } from 'express';
import auth from '../middlewares/auth';
import { FootyController, FootyEventController } from '../controllers';

const eventRouter = Router();

eventRouter.route('/').post(FootyEventController.create);

eventRouter
  .route('/all/:id')
  .get([auth], FootyController.read, FootyEventController.readAllByFooty);

eventRouter
  .route('/:id')
  .get([auth], FootyEventController.read)
  .patch([auth], FootyEventController.read, FootyEventController.update)
  .delete([auth], FootyEventController.read, FootyEventController.delete);

export default eventRouter;
