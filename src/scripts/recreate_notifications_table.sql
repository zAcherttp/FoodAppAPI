-- Script để tạo bảng notifications trong Supabase với các foreign key constraints đúng

-- Drop existing table if you want to recreate it
-- DROP TABLE IF EXISTS public.notifications;

-- Create notifications table with proper foreign key constraints
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  sender_id UUID,
  type VARCHAR NOT NULL, -- 'COMMENT', 'RATING', 'LIKE', 'DISLIKE', etc.
  content TEXT NOT NULL,
  reference_id UUID, -- ID của entity liên quan (recipe, comment, etc.)
  reference_type VARCHAR, -- Loại entity được tham chiếu ('RECIPE', 'COMMENT', etc.)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Define foreign key constraints properly
  CONSTRAINT fk_notifications_recipient
    FOREIGN KEY (recipient_id) 
    REFERENCES public.users(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_notifications_sender
    FOREIGN KEY (sender_id)
    REFERENCES public.users(id)
    ON DELETE SET NULL
);

-- Tạo các indexes để tối ưu truy vấn
CREATE INDEX IF NOT EXISTS notifications_recipient_id_idx ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS notifications_sender_id_idx ON public.notifications(sender_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);

-- Cấu hình Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy cho việc SELECT: người dùng chỉ có thể xem thông báo của họ
CREATE POLICY notifications_select_policy
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = recipient_id);

-- Policy cho việc UPDATE: người dùng chỉ có thể cập nhật thông báo của họ
CREATE POLICY notifications_update_policy
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Policy cho việc DELETE: người dùng chỉ có thể xóa thông báo của họ
CREATE POLICY notifications_delete_policy
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = recipient_id);

-- Policy cho việc INSERT: cho phép dịch vụ thêm thông báo mới
CREATE POLICY notifications_insert_policy
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);  -- Hoặc giới hạn quyền nếu cần

-- Cấp quyền cho authenticated users
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;

-- Trigger để tự động cập nhật trường updated_at
CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_timestamp
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE PROCEDURE update_notification_timestamp();
