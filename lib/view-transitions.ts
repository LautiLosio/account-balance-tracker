type ViewTransitionLike = {
  finished?: Promise<unknown>;
};

type StartViewTransition = (update: () => void | Promise<void>) => ViewTransitionLike;

export const ACCOUNT_NAME_TRANSITION_CLASS = 'account-name-shared';
export const ACCOUNT_BALANCE_TRANSITION_CLASS = 'account-balance-shared';

export function getAccountNameTransitionName(accountId: number): string {
  return `account-name-${accountId}`;
}

export function getAccountBalanceTransitionName(accountId: number): string {
  return `account-balance-${accountId}`;
}

export function runWithViewTransition(update: () => void | Promise<void>): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    void update();
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    void update();
    return;
  }

  const doc = document as Document & { startViewTransition?: StartViewTransition };

  if (typeof doc.startViewTransition !== 'function') {
    void update();
    return;
  }

  doc
    .startViewTransition(() => Promise.resolve(update()))
    .finished?.catch(() => undefined);
}
