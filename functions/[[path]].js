// Pages Function. Які шляхи взагалі доходять сюди, визначає
// public/_routes.json; решта — статика без виклику функції.
import { handle } from '../edge/proxy.mjs';

export const onRequest = (context) => handle(context.request, context.env, context);
