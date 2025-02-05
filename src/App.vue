<script>
export default {
	name: 'App',
	data() {
		return {
			walletConnectURI: '', // Default WalletConnect URI
			walletAddress: '',
			isConnected: false,
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
				this.isConnected = true;

				// Fetch the WalletConnect public key after connecting
				const response = await fetch(
					'https://verify.walletconnect.org/v3/public-key'
				);

				console.log('Response:', response);

				if (!response.ok) {
					throw new Error(`API Error: ${response.statusText}`);
				}

				const data = await response.json();

				console.log('WalletConnect Public Key:', data.publicKey);
			} catch (error) {
				console.error('Connection failed:', error);
			}
		},

		// Handles session proposals (AppKit requests a connection)
		async onSessionProposal(proposal) {
			try {
				const supportedNamespaces = {
					eip155: {
						chains: ['eip155:1'],
						methods: ['eth_sendTransaction'],
						events: ['accountsChanged', 'chainChanged'],
						// accounts: ['eip155:1:0xYourEthereumAddress'],
						accounts: [
							'eip155:1:0x84B63846DA04707bC55869B931ab3ccBD48612a4',
						],
					},
				};

				console.log('Session proposal:', proposal);

				const approvedNamespaces =
					this.$walletKit.buildApprovedNamespaces({
						proposal,
						supportedNamespaces,
					});

				console.log('Approved namespaces:', approvedNamespaces);

				await this.$walletKit.approveSession({
					id: proposal.id,
					namespaces: approvedNamespaces,
				});

				const session = Object.values(
					this.$walletKit.getActiveSessions()
				)[0];
				this.walletAddress =
					session.namespaces.eip155.accounts[0].split(':')[2];
			} catch (error) {
				console.log('Session approval failed:', error);
			}
		},

		// Handles incoming requests like "Stake"
		async onSessionRequest(event) {
			try {
				if (event.params.request.method === 'eth_sendTransaction') {
					const transaction = event.params.request.params[0];

					// Ask user for confirmation
					const confirmed = confirm(
						`Do you want to sign this transaction?`
					);
					if (!confirmed) return;

					// Sign the transaction
					const result = await this.$walletKit.request({
						topic: event.topic,
						method: 'eth_sendTransaction',
						params: [transaction],
					});

					console.log('Transaction signed:', result);
				}
			} catch (error) {
				console.log('Session request failed:', error);
			}
		},
	},
	mounted() {
		this.$walletKit.on('session_proposal', this.onSessionProposal);
		this.$walletKit.on('session_request', this.onSessionRequest);
	},
};
</script>

<template>
	<div id="app">
		<h1>WalletKit Wallet</h1>
		<input
			v-model="walletConnectURI"
			placeholder="Enter WalletConnect URI"
		/>
		<button @click="connect">Connect to AppKit</button>
		<p v-if="isConnected">Connected: {{ walletAddress }}</p>
	</div>
</template>

<style>
#app {
	text-align: center;
	margin-top: 50px;
}
input {
	padding: 10px;
	width: 300px;
	margin-bottom: 10px;
}
button {
	padding: 10px 20px;
	margin: 5px;
	cursor: pointer;
}
</style>
