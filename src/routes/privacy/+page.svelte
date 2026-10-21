<svelte:head>
  <title>Privacy Policy | Hymenia</title>
  <meta name="description" content="Hymenia Privacy Policy" />
</svelte:head>

<div class="legal-page">
  <main class="legal-card">
    <a class="theme-btn" href="/">back home</a>
    <h1>Privacy Policy</h1>
    <p class="legal-updated">Effective <time datetime="2026-10-03">October 3, 2026</time></p>

    <section>
  <p>Note: We are not lawyers. This Privacy Policy was written with the assistance a Large Language Model (LLM) for completeness.</p>
</section>
<hr>

    <section>
      <h2>1. Who this policy covers</h2>
      <p>This Privacy Policy explains what information Hymenia collects, how it is used, who it is shared with, and the choices you have. It applies to the Hymenia web client, spaces, chats, voice features, invites, apps, webhooks, and related APIs (the "Service").</p>
      <p>Hymenia can be run by different people or organizations. The operator of the Hymenia instance you use is responsible for your data on that instance (the "controller" under laws such as the GDPR). References to "we", "us", or "our" mean that operator. This policy should be read together with the <a href="/terms">Terms of Service</a>.</p>
      <p>Hymenia is free and open source software released under the MIT License, so anyone can inspect how it handles data. Operators may run modified versions, so this policy describes the standard software; the operator of a modified instance is responsible for describing any differences.</p>
    </section>

    <section>
      <h2>2. Information you give us</h2>
      <ul>
        <li><strong>Account details:</strong> your username, email address if email verification is enabled, and password. Passwords are stored by the server in hashed form, not in plain text.</li>
        <li><strong>Email verification:</strong> if you provide an email address, we may send verification messages and store verification status and temporary verification tokens. Verification tokens are used only to confirm control of the address and are deleted or invalidated after use or expiration.</li>
        <li><strong>Passkeys:</strong> if you use a passkey, the server stores the public key and credential identifier. Your private key and any biometric data stay on your device and are never sent to us.</li>
        <li><strong>Profile:</strong> your display name, bio, and avatar image. These are visible to other users.</li>
        <li><strong>Messages and content:</strong> messages, replies, and other content you post, along with space and chat names you create.</li>
        <li><strong>Spaces and relationships:</strong> the spaces you create or join, your roles, invite links you create or use, and apps you approve.</li>
        <li><strong>Developer data:</strong> apps and webhooks you create, their names, tokens, and the content they send.</li>
        <li><strong>Communications:</strong> anything you send to the operator, such as support requests or abuse reports.</li>
      </ul>
    </section>

    <section>
      <h2>3. Information collected automatically</h2>
      <ul>
        <li><strong>Connection and log data:</strong> IP address, browser and device information, request times, and error logs that servers routinely record when you connect.</li>
        <li><strong>Session and activity data:</strong> authentication tokens, connection status, timestamps of messages, and other data needed to deliver messages in real time.</li>
        <li><strong>Voice data:</strong> when you join a voice call, your connection details, such as your IP address and session information, are sent to the operator's LiveKit server. That server routes voice audio between participants and may process connection metadata and audio data while the call is active. Voice calls are not end-to-end encrypted unless the operator has separately enabled that feature.</li>
      </ul>
      <p>The Hymenia client does not include advertising trackers or third-party analytics.</p>
    </section>

    <section>
      <h2>4. Information stored on your device</h2>
      <p>The Hymenia client uses your browser's local storage, not tracking cookies, to keep you signed in and remember your preferences. This includes:</p>
      <ul>
        <li>Your authentication token and basic account details, so you stay signed in.</li>
        <li>Interface preferences such as theme, accent color, column widths, and whether Enter sends a message.</li>
        <li>Your last opened space and chat, if you choose to restore your last location.</li>
      </ul>
      <p>This data stays in your browser. Signing out removes your sign-in data, and you can remove everything by clearing your browser's site data.</p>
    </section>

    <section>
      <h2>5. Third-party services</h2>
      <ul>
        <li><strong>hCaptcha:</strong> the client loads hCaptcha (operated by Intuition Machines, Inc.) to protect registration and sign-in from abuse. hCaptcha may collect device and usage information, such as your IP address and browser data. Its use of that data is governed by the <a href="https://www.hcaptcha.com/privacy" target="_blank" rel="noopener noreferrer">hCaptcha Privacy Policy</a>.</li>
        <li><strong>Email delivery providers:</strong> if email verification is enabled, the operator may use an email delivery provider to send verification messages. That provider may process your email address, message delivery information, and technical logs needed to deliver the message.</li>
        <li><strong>STUN servers:</strong> to help establish voice calls, your browser may contact a public STUN server (currently operated by Google) to discover its public network address. That server sees your IP address. See the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.On the official instance, LiveKit itself is hosted and operated by the Hymenia operator, not by a separate LiveKit cloud service.</li>
        <li><strong>Apps and integrations:</strong> apps added to a space can read content in that space as allowed by the Service, and webhooks can post into chats. Apps and integrations are run by their creators, not by the operator, and their own terms and policies apply.</li>
        <li><strong>Hosting providers:</strong> the operator may use hosting, storage, and network providers that process data on its behalf.</li>
      </ul>
    </section>

    <section>
      <h2>6. How we use information</h2>
      <ul>
        <li>To create and manage your account and sign you in securely.</li>
        <li>To verify your email address, protect your account, support account recovery, prevent account abuse and send important service messages.</li>
        <li>To store and deliver your messages, run spaces, chats, invites, and voice calls, and display your profile.</li>
        <li>To run apps and webhooks you or your space administrators set up.</li>
        <li>To keep the Service secure, prevent spam, fraud, and abuse, and enforce the Terms of Service.</li>
        <li>To troubleshoot, maintain, and improve the Service.</li>
        <li>To respond to your requests and communicate with you about the Service, including important changes.</li>
        <li>To comply with legal obligations and respond to lawful requests.</li>
      </ul>
      <p>We do not sell your personal information, and we do not use your messages for advertising.</p>
    </section>

    <section>
      <h2>7. Legal bases</h2>
      <p>Where laws such as the GDPR apply, we process your information on these bases:</p>
      <ul>
        <li><strong>Contract:</strong> to provide the Service you signed up for.</li>
        <li><strong>Legitimate interests:</strong> to keep the Service secure, prevent abuse, and improve it, where those interests are not overridden by your rights.</li>
        <li><strong>Legal obligation:</strong> where we must process data to comply with the law.</li>
        <li><strong>Consent:</strong> where we ask for it. You can withdraw consent at any time.</li>
      </ul>
    </section>

    <section>
      <h2>8. Who can see your information</h2>
      <ul>
        <li><strong>Other users:</strong> your username, display name, bio, and avatar are visible to other users. Messages you post in a space are visible to its members and to apps added to that space.</li>
        <li><strong>Voice participants:</strong> other participants can hear your voice and see the identity information shown by the Service. Because calls are routed through the operator's self-hosted LiveKit server, participants are not normally given each other's network addresses directly.</li>
        <li><strong>Space administrators:</strong> can see membership and moderate content in their spaces.</li>
        <li><strong>The operator:</strong> has technical access to data stored on its servers and may access it to run, secure, and moderate the Service.</li>
        <li><strong>Service providers:</strong> as described in section 5.</li>
        <li><strong>Legal and safety:</strong> we may disclose information if we believe in good faith it is required by law, or needed to protect the rights, property, or safety of users, the operator, or others.</li>
        <li><strong>Transfers:</strong> if the Service is reorganized, merged, or transferred to a new operator, your information may be transferred as part of that, subject to this policy.</li>
      </ul>
    </section>

    <section>
      <h2>9. Message privacy</h2>
      <p>Messages are encrypted in transit when the Service is accessed over HTTPS and secure WebSockets, but they are not end-to-end encrypted. They are stored on the operator's servers and can technically be accessed by the operator. Do not share information you would not want the operator or the members of a space to see.</p>
    </section>

    <section>
      <h2>10. Data retention</h2>
      <ul>
        <li>We keep your account and profile data for as long as your account is active.</li>
        <li>Email addresses are kept while needed for account verification, account recovery, prevent account abuse or important service messages. Temporary verification tokens are deleted or invalidated after use or expiration.</li>
        <li>Messages are kept until they are deleted, the chat or space they belong to is deleted, or your account is deleted, unless we need to keep them longer to comply with law or resolve abuse reports.</li>
        <li>Server logs are kept for a limited period for security and troubleshooting.</li>
        <li>Deleted data may remain in backups for a limited time before it is overwritten.</li>
      </ul>
      <p>When you delete your account, your profile and sign-in data are removed. Messages you sent in shared spaces may remain visible to other members unless you delete them first, and may be shown as coming from a deleted user.</p>
    </section>

    <section>
      <h2>11. Security</h2>
      <p>We use reasonable technical and organizational measures to protect your information, including hashed passwords, token-based authentication, and support for passkeys. No system is completely secure. Help protect your account by using a strong, unique password or a passkey, keeping app tokens and webhook URLs secret, and signing out on shared devices.</p>
    </section>

    <section>
      <h2>12. Your rights and choices</h2>
      <p>Depending on where you live, you may have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you and get a copy of it.</li>
        <li>Correct inaccurate information. You can edit your profile directly in settings.</li>
        <li>Delete your information or your account.</li>
        <li>Object to or restrict certain processing.</li>
        <li>Receive your data in a portable format.</li>
        <li>Withdraw consent where processing is based on consent.</li>
        <li>Lodge a complaint with your local data protection authority.</li>
      </ul>
      <p>To exercise these rights, contact the operator of your Hymenia instance. We may need to verify your identity before acting on a request. We will not discriminate against you for exercising your rights.</p>
    </section>

    <section>
      <h2>13. International transfers</h2>
      <p>The operator and its service providers may store and process information in countries other than your own. Where required, the operator will use appropriate safeguards for those transfers.</p>
    </section>

    <section>
      <h2>14. Children</h2>
      <p>The Service is not intended for children under 13, or under the minimum age for consenting to online services in their country. We do not knowingly collect personal information from them. If you believe a child has provided us information, contact the operator and we will remove them from the Service and delete their records.</p>
    </section>

    <section>
      <h2>15. Changes to this policy</h2>
      <p>We may update this Privacy Policy from time to time. When we do, we will update the effective date above, and for material changes we will make reasonable efforts to notify you, for example through the Service. Continued use of the Service after an update means you accept the revised policy.</p>
    </section>

    <section>
      <h2>16. Contact</h2>
      <p>Questions or requests about your privacy should be sent to the operator of the Hymenia instance you use.</p>
    </section>
  </main>
</div>
