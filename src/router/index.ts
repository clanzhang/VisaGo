// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/Home'),
    meta: { title: 'nav.home' },
  },
  {
    path: '/assistant',
    name: 'assistant',
    component: () => import('../pages/Assistant'),
    meta: { title: 'nav.assistant' },
  },
  {
    path: '/tracker',
    name: 'tracker',
    component: () => import('../pages/Tracker'),
    meta: { title: 'nav.tracker' },
  },
  {
    path: '/documents',
    name: 'documents',
    component: () => import('../pages/Documents'),
    meta: { title: 'nav.documents' },
  },
  {
    path: '/encyclopedia',
    name: 'encyclopedia',
    component: () => import('../pages/Encyclopedia'),
    meta: { title: 'nav.encyclopedia' },
  },
  {
    path: '/encyclopedia/compare',
    name: 'compare',
    component: () => import('../pages/Compare'),
    meta: { title: 'encyclopedia.compareTitle' },
  },
  {
    path: '/encyclopedia/:id',
    name: 'country-detail',
    component: () => import('../pages/CountryDetail'),
    meta: { title: 'encyclopedia.title' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
