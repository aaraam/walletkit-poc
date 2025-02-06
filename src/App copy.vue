<script>



export default {
	name: 'App',
	data() {
		return {
			walletConnectURI: '',
			walletAddress: '',
			isConnected: false,
			chainId: null,
			pendingTransaction: null, // Store transaction request
		};
	},
	methods: {
		// Connects WalletKit to the AppKit page
		async connect() {
			if (!this.walletConnectURI.startsWith('wc:')) {
				alert('Please enter a valid WalletConnect URI.');
				return;
			}

			try {
				await this.$walletKit.pair({ uri: this.walletConnectURI });
				console.log('Connected to AppKit:', this.$walletKit.getActiveSessions());
				console.log('ETNIRE', this.$walletKit);
				
				
				this.isConnected = true;
				this.loadActiveSession();
			} catch (error) {
				console.error('Connection failed:', error);
			}
		},

		// Load existing session on page load
		async loadActiveSession() {
			try {
				const session = Object.values(this.$walletKit.getActiveSessions())[0];
				if (session) {
					this.isConnected = true;
					this.walletAddress = session.namespaces.eip155.accounts[0].split(':')[2];
					this.chainId = session.namespaces.eip155.chains[0];

					console.log('Restored session:', session);
				}
			} catch (error) {
				console.error('Failed to restore session:', error);
			}
		},

		// Handles session proposals (AppKit requests a connection)
		async onSessionProposal(proposal) {
			try {
				const requestedChain =
					proposal.params.requiredNamespaces.eip155?.chains[0] || 'eip155:1';
				this.chainId = requestedChain;

				console.log('Requested Chain:', requestedChain);

				const supportedNamespaces = {
					eip155: {
						chains: [requestedChain],
						methods: ['eth_sendTransaction', 'wallet_switchEthereumChain'],
						events: ['accountsChanged', 'chainChanged'],
						accounts: [`${requestedChain}:0x84B63846DA04707bC55869B931ab3ccBD48612a4`],
					},
				};

				await this.$walletKit.approveSession({
					id: proposal.id,
					namespaces: supportedNamespaces,
				});

				this.loadActiveSession();
				await this.switchNetwork(requestedChain);
			} catch (error) {
				console.log('Session approval failed:', error);
			}
		},

		// Handles network switching
		async switchNetwork(requestedChain) {
			try {
				const session = Object.values(this.$walletKit.getActiveSessions())[0];
				if (!session) return;

				if (this.chainId === requestedChain) {
					console.log(`Already on correct chain: ${requestedChain}`);
					return;
				}

				await this.$walletKit.request({
					topic: session.topic,
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: requestedChain }],
				});

				console.log(`Switched to chain: ${requestedChain}`);
			} catch (error) {
				console.log('Network switch failed:', error);
			}
		},

		// Handles incoming transaction requests
		async onSessionRequest(event) {
			try {
				if (event.params.request.method === 'eth_sendTransaction') {
					const transaction = event.params.request.params[0];
					this.pendingTransaction = transaction; // Store transaction for modal

					console.log('Received transaction request:', transaction);
				}
			} catch (error) {
				console.log('Transaction request handling failed:', error);
			}
		},

		// Approves transaction and submits it
		async approveTransaction() {
			try {
				if (!this.pendingTransaction) {
					console.error('No pending transaction found.');
					return;
				}

				const session = Object.values(this.$walletKit.getActiveSessions())[0];

				if (!session) {
					console.error('No active session found.');
					return;
				}

				const result = await this.$walletKit.request({
					topic: session.topic,
					method: 'eth_sendTransaction',
					params: [this.pendingTransaction],
				});

				console.log('Transaction signed & broadcasted:', result);
				this.pendingTransaction = null; // Clear pending transaction
			} catch (error) {
				console.log('Transaction approval failed:', error);
			}
		},

		// Reject transaction request
		rejectTransaction() {
			console.log('Transaction rejected');
			this.pendingTransaction = null;
		},
	},
	mounted() {
		this.$walletKit.on('session_proposal', this.onSessionProposal);
		this.$walletKit.on('session_request', this.onSessionRequest);
		this.loadActiveSession(); // Auto-load session on page load
	},
};
</script>

<template>
	<div id="app">
		<div class="wallet-container">
			<h1>WalletKit Wallet</h1>
			<div class="input-group">
				<input v-model="walletConnectURI" placeholder="Enter WalletConnect URI" />
				<button @click="connect">Connect to AppKit</button>
			</div>
			<p v-if="isConnected" class="status">Connected: {{ walletAddress }}</p>
			<p v-if="chainId" class="status">Network: {{ chainId }}</p>
		</div>

		<!-- Pending Transaction Modal -->
		<div v-if="pendingTransaction" class="modal">
			<h2>Transaction Request</h2>
			<p><b>To:</b> {{ pendingTransaction.to }}</p>
			<p><b>Data:</b> {{ pendingTransaction.data }}</p>
			<button class="approve-btn" @click="approveTransaction">Send</button>
			<button class="reject-btn" @click="rejectTransaction">Reject</button>
		</div>
	</div>
</template>

<style>
/* Global Styling */
body {
	font-family: 'Inter', sans-serif;
	background-color: #181818;
	color: #fff;
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	margin: 0;
}

/* Centered Wallet Card */
.wallet-container {
	background: #222;
	padding: 30px;
	border-radius: 12px;
	box-shadow: 0 4px 10px rgba(255, 255, 255, 0.1);
	text-align: center;
	width: 380px;
}

/* Input and Button Group */
.input-group {
	display: flex;
	justify-content: space-between;
	gap: 10px;
	margin-top: 20px;
}

input {
	flex: 1;
	padding: 12px;
	border-radius: 8px;
	border: 1px solid #444;
	background: #333;
	color: white;
	outline: none;
}

/* Buttons */
button {
	padding: 12px 20px;
	background: #4eea7d;
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-weight: bold;
	transition: 0.3s ease-in-out;
}

button:hover {
	background: #4eea7d;
}

/* Status Messages */
.status {
	background: #333;
	padding: 8px;
	border-radius: 6px;
	margin-top: 15px;
	font-size: 14px;
	color: #ccc;
}

/* Modal Styling */
.modal {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: #222;
	padding: 20px;
	border-radius: 10px;
	box-shadow: 0px 4px 10px rgba(255, 255, 255, 0.1);
	text-align: center;
	width: 400px;
}

button.approve-btn {
	background: #28a745;
	color: white;
	padding: 10px;
	margin-top: 10px;
	border-radius: 6px;
	cursor: pointer;
}

button.reject-btn {
	background: #ff4d4d;
	color: white;
	padding: 10px;
	margin-top: 10px;
	border-radius: 6px;
	cursor: pointer;
}
</style>