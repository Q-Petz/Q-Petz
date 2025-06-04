import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";
import { setupRouter } from "./router";
import { setupPinia } from "./store";
import { setupSystem } from "./system";

function boostrap() {
  setupSystem();
  const app = createApp(App);
  setupPinia(app);
  setupRouter(app);
  app.mount("#app");
}

boostrap();
