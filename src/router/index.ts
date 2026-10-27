import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

/** Route meta read by AppShell to pick the page chrome. */
declare module "vue-router" {
  interface RouteMeta {
    /** "app" (sidebar + top bar, default), "focus" (full-screen create/edit), "onboarding" (sign-up rail) or "bare" (website mock-ups). */
    layout?: "app" | "focus" | "onboarding" | "bare";
    title?: string;
  }
}

const focus = { layout: "focus" } as const;
const onboarding = { layout: "onboarding" } as const;

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/cards" },

  // Cards
  { path: "/cards", component: () => import("@/components/cards/CardsOverview.vue"), meta: { title: "Cards" } },
  { path: "/cards/new", component: () => import("@/components/create/NewCard.vue"), meta: { ...focus, title: "Create card" } },
  { path: "/cards/request", component: () => import("@/components/create/RequestCardForm.vue"), meta: { ...focus, title: "Request a card" } },
  { path: "/cards/check-merchant", component: () => import("@/components/merchant/CheckMerchantPage.vue"), meta: { title: "Check a merchant" } },
  { path: "/cards/:cardId", component: () => import("@/components/cards/CardPage.vue"), props: true, meta: { title: "Card" } },
  { path: "/cards/:cardId/edit", component: () => import("@/components/create/EditCard.vue"), props: true, meta: { ...focus, title: "Edit card" } },
  { path: "/cards/:cardId/transactions", component: () => import("@/components/transactions/TransactionsPage.vue"), props: true, meta: { title: "Transactions" } },
  { path: "/requests", component: () => import("@/components/requests/RequestsPage.vue"), meta: { title: "Requests" } },
  { path: "/subscriptions", component: () => import("@/components/subscriptions/SubscriptionsPage.vue"), meta: { title: "Subscriptions" } },
  { path: "/travel", component: () => import("@/components/travel/TravelPage.vue"), meta: { title: "Spending abroad" } },
  { path: "/global-account", component: () => import("@/components/autofx/GlobalAccount.vue"), meta: { title: "Global account" } },

  // Account setup after sign-up
  { path: "/get-started", component: () => import("@/components/get-started/GetStartedPage.vue"), meta: { title: "Get started" } },
  { path: "/get-started/stakeholders", component: () => import("@/components/get-started/StakeholdersPage.vue"), meta: { title: "Stakeholders" } },
  { path: "/get-started/verification", component: () => import("@/components/get-started/VerificationPage.vue"), meta: { title: "Verification" } },
  { path: "/get-started/documents", component: () => import("@/components/get-started/DocumentsPage.vue"), meta: { title: "Documents" } },
  { path: "/get-started/questionnaire", component: () => import("@/components/get-started/QuestionnairePage.vue"), meta: { title: "Questionnaire" } },

  // Sign-up
  { path: "/onboarding", component: () => import("@/components/onboarding/WelcomeRequirements.vue"), meta: { ...onboarding, title: "Sign up" } },
  { path: "/onboarding/use", component: () => import("@/components/onboarding/UseCases.vue"), meta: onboarding },
  { path: "/onboarding/account", component: () => import("@/components/onboarding/CreateAccount.vue"), meta: onboarding },
  { path: "/onboarding/verify-email", component: () => import("@/components/onboarding/VerifyEmail.vue"), meta: onboarding },
  { path: "/onboarding/identity", component: () => import("@/components/onboarding/VerifyIdentity.vue"), meta: onboarding },
  { path: "/onboarding/identity/confirmed", component: () => import("@/components/onboarding/IdentityConfirmed.vue"), meta: onboarding },
  { path: "/onboarding/business", component: () => import("@/components/onboarding/FindBusiness.vue"), meta: onboarding },
  { path: "/onboarding/business/profile", component: () => import("@/components/onboarding/BusinessProfile.vue"), meta: onboarding },
  { path: "/onboarding/compliance", component: () => import("@/components/onboarding/ComplianceDetails.vue"), meta: onboarding },
  { path: "/onboarding/review", component: () => import("@/components/onboarding/ReviewDetails.vue"), meta: onboarding },
  { path: "/onboarding/welcome", component: () => import("@/components/onboarding/Welcome.vue"), meta: onboarding },

  // Prototype-only pages
  { path: "/qa", component: () => import("@/views/QAPage.vue"), meta: { title: "QA checklist" } },
  { path: "/website", component: () => import("@/views/WebsitePage.vue"), meta: { layout: "bare", title: "Foren — try it" } },

  { path: "/:pathMatch(.*)*", component: () => import("@/views/NotFoundPage.vue"), meta: { title: "Not found" } },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (to, from, saved) => saved ?? (to.path !== from.path ? { top: 0 } : undefined),
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Foren Cards` : "Foren Cards";
});
