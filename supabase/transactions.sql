
-- Transactions and Payment Tracking System

-- Transactions table for all financial activities
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order_payment', 'refund', 'withdrawal', 'deposit', 'fee', 'commission')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('card', 'transfer', 'wallet', 'cash')),
  payment_reference TEXT,
  metadata JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Wallet balances for users
CREATE TABLE IF NOT EXISTS wallet_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 0.00 CHECK (balance >= 0),
  pending_balance DECIMAL(10, 2) DEFAULT 0.00,
  total_earned DECIMAL(10, 2) DEFAULT 0.00,
  total_withdrawn DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  bank_account_id UUID REFERENCES payment_methods(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
  notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user ON wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "System can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update transactions"
  ON transactions FOR UPDATE
  USING (true);

-- RLS Policies for wallet_balances
CREATE POLICY "Users can view their own wallet balance"
  ON wallet_balances FOR SELECT
  USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can update their wallet"
  ON wallet_balances FOR UPDATE
  USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "System can insert wallet balances"
  ON wallet_balances FOR INSERT
  WITH CHECK (true);

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can update their pending withdrawals"
  ON withdrawal_requests FOR UPDATE
  USING (
    auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id)
    AND status = 'pending'
  );

-- Triggers
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER wallet_balances_updated_at
  BEFORE UPDATE ON wallet_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER withdrawal_requests_updated_at
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS wallet_balances;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS withdrawal_requests;
