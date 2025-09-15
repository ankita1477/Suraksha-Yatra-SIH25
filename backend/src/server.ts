import { createApp, attachRealtime } from './app';
import { ENV } from './config/env';

const app = createApp();
const { server } = attachRealtime(app);

server.listen(ENV.PORT, () => {
  console.log(`Backend listening on :${ENV.PORT}`);
});
