import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      GCLOUD_PROJECT: 'extrahub-test-project',
      FIREBASE_PROJECT_ID: 'extrahub-test-project',
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
      FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
    },
  },
});
