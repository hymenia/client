export function mapServerMessage(row, { nested = false } = {}) {
    if (!row) return null;

    const sender = row.sender_name_override || row.sender || "Unknown";

    let replyTo = null;
    if (!nested && row.reply_to_id) {
        replyTo = row.reply_to
            ? mapServerMessage(row.reply_to, { nested: true })
            : { id: row.reply_to_id, unavailable: true };
    }

    return {
        id: row.id,
        createdAt: row.created_at ?? null,
        editedAt: row.edited_at ?? null,
        deletedAt: row.deleted_at ?? null,
        userId: row.sender_id ?? row.user_id ?? null,
        sender,
        senderDisplayName: row.sender_name_override || row.sender_display_name || sender,
        senderAvatarUrl: row.sender_avatar_url_override || row.sender_avatar_url || null,
        senderGlobalRoles: row.sender_global_roles ?? [],
        senderIsApp: !!row.sender_is_bot,
        webhookId: row.webhook_id ?? null,
        content: row.deleted_at ? "" : (row.content ?? ""),
        replyTo,
        attachments: nested ? [] : (row.attachments ?? []),
        reactions: nested ? [] : (row.reactions ?? []),
    };
}
