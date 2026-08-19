import type { CloudflareEnv } from "../shared/api/_lib/env";
import { updateHeroDog } from "../shared/api/hero-dog/update";

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: CloudflareEnv,
  ): Promise<void> {
    console.log(
      `Hero-dog cron started: ${controller.cron} at ${new Date(controller.scheduledTime).toISOString()}`,
    );

    const result = await updateHeroDog(env);

    if (result.status >= 400) {
      throw new Error(
        `Hero-dog cron failed with status ${result.status}: ${result.body.message}`,
      );
    }

    console.log("Hero-dog cron completed successfully.");
  },
};
