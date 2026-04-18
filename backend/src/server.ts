import { createApp } from "./api/createApp.js";
import { createDependencies } from "./container.js";

const dependencies = createDependencies();
const app = await createApp(dependencies);

try {
  await app.listen({
    port: dependencies.env.PORT,
    host: "0.0.0.0",
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
