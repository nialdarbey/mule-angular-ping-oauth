(function() {
	'use strict';
	var bnz = angular.module('bnz', ['ui.router', 'bnz-security']);
	  
	function MyBillsController($scope, $http) {
		  // You're free to call your protected API if you get this far!
		  $http.get('https://alainn-api.cloudhub.io/omni-channel-api/v1.0/items').then(function(response) {
			  $scope.bills = response;
		  });
	  };
	  
	bnz.config(function config($stateProvider, $urlRouterProvider, $locationProvider) {
	  		
			// html5 mode to have pretty urls instead of the /#/x/y/z type. PingFederate won't accept a redirectUri with # so you should use html5.
			// You will need to do server-side url rewriting to facilitate this.
		
			// I commented it out because I had problems. I do server-side rewriting in the mule app. See src/main/app/bnz.xml
			//$locationProvider.html5Mode(true);
		
			// Default state
			$urlRouterProvider.otherwise('my-bills');
	  		
	  		$stateProvider
	  			.state('my-bills', {
	  				url: '/my-bills',
	  				templateUrl: 'partials/myBills.html',
	  				controller: MyBillsController
	  			})
	  			
	  			/*
	  			 * Following state presuppose that server-side redirects will be configured.
	  			 * See https://github.com/angular-ui/ui-router/wiki/Frequently-Asked-Questions#how-to-configure-your-server-to-work-with-html5mode
	  			 */
	  			.state('auth-code', {
	  				url: '/auth?token&state',
	  				onEnter: function($state, $stateParams, authenticationService, sessionService) {
	  					// store the token. This will be picked up by our authInterceptor. See nzp-security module.
						sessionService.setUser($stateParams.token);
						// Now proceed either to requested state or the default
						var state = null;
						if ($stateParams.state) {
							state = authenticationService.decodeState($stateParams.state).state;
						};
						delete $stateParams.state;
						delete $stateParams.token;
						$state.go(state || 'my-bills', $stateParams || {});
	  				}
	  			});
	  	});
	
	bnz.run(function run($rootScope, authenticationService) {
	      // by hooking up to this, we can detect when we are moving into a state, if we are not logged in
	      // we keep the target URL and go to the OAuth dance
	  		$rootScope.$on('$stateChangeStart', function onStateChangeStart(event, to, toParams) {
		        
	  			// Redirect from PingFederate should be let through 
		        if (['auth-code'].indexOf(to.name) != -1) {
		          return;
		        }
		
		        // user is authenticated, no need to call PingFederate SignIn
		        if (authenticationService.isAuthenticated()) {
		          return;
		        }
		
		        // Call PingFederate SignIn
		        authenticationService.requestCode({
		          state:  to.name,
		          params: toParams
		        });
		
		        // stop the state transition as we're going to PingFederate
		        event.preventDefault();
	  		});
	    });
	

	 

	  
	  
	
})();