
import React, { useState } from 'react';
import { RefreshControl, ScrollView, ScrollViewProps } from 'react-native';

interface PullToRefreshProps extends ScrollViewProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  ...props
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#4682B4"
          colors={['#4682B4']}
        />
      }
      {...props}
    >
      {children}
    </ScrollView>
  );
};
