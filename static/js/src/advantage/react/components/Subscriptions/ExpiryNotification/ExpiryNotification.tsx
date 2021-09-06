import {
  Notification,
  NotificationSeverity,
  PropsWithSpread,
} from "@canonical/react-components";
import type { NotificationProps } from "@canonical/react-components";
import React, { ReactNode } from "react";

import { UserSubscriptionStatuses } from "advantage/api/types";

export enum ExpiryNotificationSize {
  Small = "small",
  Medium = "medium",
  Large = "large",
}

export enum StatusKey {
  IsExpired = "is_expired",
  IsInGracePeriod = "is_in_grace_period",
  IsExpiring = "is_expiring",
}

type Props = PropsWithSpread<
  {
    multiple?: boolean;
    size: ExpiryNotificationSize;
    statuses: UserSubscriptionStatuses;
  },
  NotificationProps
>;

type Messages = Record<
  StatusKey,
  { [K in ExpiryNotificationSize]?: { message: ReactNode; title?: ReactNode } }
>;

// The expiry status keys in priority order.
const STATUS_KEYS = [
  StatusKey.IsExpired,
  StatusKey.IsInGracePeriod,
  StatusKey.IsExpiring,
];

/**
 * A definition of the expiry notification messages.
 * Large is displayed in the subscriptions header.
 * Medium is used in the subscription details.
 * Small is used in the subscription list.
 */
const MESSAGES: Messages = {
  [StatusKey.IsExpiring]: {
    [ExpiryNotificationSize.Large]: {
      message:
        'Select a subscription, then "Renew subscription..." to renew it.',
      title: "Your subscription is about to expire.",
    },
    [ExpiryNotificationSize.Small]: {
      message: "Subscription about to expire",
    },
  },
  [StatusKey.IsExpired]: {
    [ExpiryNotificationSize.Large]: {
      message: "It will be removed within 14 days if it's not renewed.",
      title: "Your subscription has expired.",
    },
    [ExpiryNotificationSize.Medium]: {
      message: (
        <>
          Please <a href="/contact-us">contact us</a>.
        </>
      ),
      title: "This subscription has expired.",
    },
    [ExpiryNotificationSize.Small]: {
      message: "Subscription expired",
    },
  },
  [StatusKey.IsInGracePeriod]: {
    [ExpiryNotificationSize.Large]: {
      message: "It will be removed within 14 days if it's not renewed.",
      title: "Your subscription has expired.",
    },
    [ExpiryNotificationSize.Small]: {
      message: "Subscription expired",
    },
  },
};

const getNotification = (
  statusKey: StatusKey,
  size: ExpiryNotificationSize
) => {
  const status = MESSAGES[statusKey];
  // When there is no medium message defined then use the large one.
  const useSize =
    size === ExpiryNotificationSize.Medium && !(size in status)
      ? ExpiryNotificationSize.Large
      : size;
  return status[useSize];
};

const ExpiryNotification = ({
  multiple = false,
  size,
  statuses,
  ...notificationProps
}: Props) => {
  let statusesToShow: StatusKey[] = [];
  const highestStatus = STATUS_KEYS.find((status) => statuses[status]);
  if (multiple) {
    // When displaying multiple notifications then find all the statuses that
    // are true.
    statusesToShow = STATUS_KEYS.filter((status) => statuses[status]);
  } else if (highestStatus) {
    // When displaying a single status then just show the highest priority
    // status.
    statusesToShow = [highestStatus];
  }
  const notifications = statusesToShow.map((statusKey) => {
    const notification = getNotification(statusKey, size);
    return {
      children: notification?.message,
      key: `${statusKey}-${size}`,
      // Display a title for medium and large notifications.
      title:
        notification &&
        size !== ExpiryNotificationSize.Small &&
        "title" in notification
          ? notification.title
          : null,
      borderless: size !== ExpiryNotificationSize.Large,
    };
  });

  return (
    <>
      {notifications.map(({ key, ...props }, i) => (
        <Notification
          data-test={key}
          inline
          severity={NotificationSeverity.CAUTION}
          {...props}
          {...notificationProps}
          key={key}
        />
      ))}
    </>
  );
};

export default ExpiryNotification;
