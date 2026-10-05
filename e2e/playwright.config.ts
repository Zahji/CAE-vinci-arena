import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    // Runs auth.setup.ts once to create session files
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Authenticated as regular user (lea@mail.com)
    {
      name: 'chromium-user',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts|login\.spec\.ts|register\.spec\.ts|profile-public\.spec\.ts|teams-public\.spec\.ts|members-public\.spec\.ts|tournament-details-public\.spec\.ts|member-details-public\.spec\.ts|match-detail-public\.spec\.ts|tournaments-admin\.spec\.ts|tournament-admin-flows\.spec\.ts|selection\.spec\.ts|selection-planified\.spec\.ts|match-contest\.spec\.ts/,
    },
    // Authenticated as admin (ines@mail.com)
    {
      name: 'chromium-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts|login\.spec\.ts|register\.spec\.ts|profile\.spec\.ts|profile-public\.spec\.ts|teams\.spec\.ts|members\.spec\.ts|tournament-details\.spec\.ts|tournament-user-flows\.spec\.ts|teams-public\.spec\.ts|members-public\.spec\.ts|tournament-details-public\.spec\.ts|member-details\.spec\.ts|member-details-public\.spec\.ts|match-detail\.spec\.ts|match-detail-public\.spec\.ts|selection\.spec\.ts|selection-planified\.spec\.ts|match-contest\.spec\.ts|notification\.spec\.ts|bracket\.spec\.ts/,
    },
    // Authenticated as TEAM_DELTA manager (seb@mail.com) — for selection tests
    {
      name: 'chromium-manager',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/manager.json',
      },
      dependencies: ['setup'],
      testMatch: /selection\.spec\.ts|match-contest\.spec\.ts/,
    },
    // Tibo — TEAM_OMEGA manager + admin (same storage as admin) for PLANIFIED selection
    {
      name: 'chromium-omega',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
      testMatch: /selection-planified\.spec\.ts/,
    },
    // No authentication — for login/register/unauthenticated tests
    {
      name: 'chromium-public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /login\.spec\.ts|register\.spec\.ts|profile-public\.spec\.ts|teams-public\.spec\.ts|members-public\.spec\.ts|tournament-details-public\.spec\.ts|member-details-public\.spec\.ts|match-detail-public\.spec\.ts|bracket-public\.spec\.ts/,
    },
  ],
});
