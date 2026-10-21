export function mapServerMessage(row) {
  return {
    id: row.id,
    createdAt: row.created_at || null,
    sender: row.sender || 'Unknown',
    senderDisplayName: row.sender_display_name || row.sender || 'Unknown',
    senderGlobalRoles: row.sender_global_roles || [],
    senderIsApp: row.sender_is_bot || false,
    content: row.content,
    replyToId: row.reply_to_id || null,
    replyToSender: row.reply_to_sender || null,
    replyToContent: row.reply_to_content || null,
    attachments: row.attachments || []
  };
}
