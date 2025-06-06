-- Add Trolley API integration fields to withdrawal_requests table

-- Add columns for Trolley recipient and payout tracking
ALTER TABLE withdrawal_requests 
ADD COLUMN IF NOT EXISTS trolley_recipient_id TEXT,
ADD COLUMN IF NOT EXISTS trolley_payout_id TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_trolley_recipient_id 
ON withdrawal_requests(trolley_recipient_id);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_trolley_payout_id 
ON withdrawal_requests(trolley_payout_id);

-- Update the status enum to include 'processing' status for Trolley payouts
ALTER TABLE withdrawal_requests 
DROP CONSTRAINT IF EXISTS withdrawal_requests_status_check;

ALTER TABLE withdrawal_requests 
ADD CONSTRAINT withdrawal_requests_status_check 
CHECK (status IN ('pending', 'approved', 'completed', 'rejected', 'processing'));

-- Enable realtime for withdrawal_requests if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'withdrawal_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE withdrawal_requests;
  END IF;
END $$;
