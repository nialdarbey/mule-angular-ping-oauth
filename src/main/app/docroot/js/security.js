(function () {
  'use strict';
  
  var bnzSecurity = angular.module('bnz-security', []);
  
  // Code to call upon http interception
  bnzSecurity.factory('authInterceptor', function authInterceptor(sessionService) {
    	return {
        // Override request method to add the Authorization header to all requests
    		request: function request(config) {
    			config.headers = config.headers || {};

    			if (sessionService.getUser()) {
    				config.headers.Authorization = 'Bearer ' + sessionService.getUser();//.access_token;
    			}

    			return config;
    		}
    	};
    });
  	
  // Make every http request intercepted with authInterceptor
  bnzSecurity.config(function config($httpProvider) {
	  $httpProvider.interceptors.push('authInterceptor');
  });
  
  // Just store the OAuth token
  bnzSecurity.service('sessionService', function sessionService(localConfigService) {
	  
		var self = this;
		
		angular.extend(self, {
			closeSession: function closeSession() {
				localConfigService.removeItem('user');
			},
		
			getUser: function getUser() {
				return localConfigService.getItem('user');
			},
		
			setUser: function setUser(user) {
				if (!user) {
					localConfigService.removeItem('user');
					return;
				}
		
				localConfigService.setItem('user', user);
			}
		});
    
  });
  


  
  bnzSecurity.service('authenticationService', function authenticationService($http, $location, $window, sessionService) {
      var self = this;

      self.encodeState = function(state) {
        return $window.btoa(JSON.stringify(state));
      }

      self.decodeState = function(state) {
        return JSON.parse($window.atob(state));
      }

      self.requestCode = function(state) {
          sessionService.setUser();

          var signinUri = 'https://ec2-54-69-90-236.us-west-2.compute.amazonaws.com:9031/as/authorization.oauth2';
          var query     = {
            'response_type': 'code',
            'client_id':     'angular-app',
            'state':         self.encodeState(state || {})
          };

          var url = signinUri + '?' + Object.keys(query).map(function (key) {
            return key + '=' + encodeURIComponent(query[key]);
          }).join('&');

          // Make the browser request url
          $window.location = url;
      };

      self.isAuthenticated = function isAuthenticated() {
        return sessionService.getUser();
      };

      return self;
    });
  
  	// Return promise. Call then() on promise
  	self.requestToken = function(code) {
		var body = {
				'grant_type' : 'authorization_code',
				'client_id' : 'angular-app',
				'scope' : 'full',
				'code' : code
		};
		return $http.post('https://ec2-54-69-90-236.us-west-2.compute.amazonaws.com:9031/as/token.oauth2', body);
	};
	
	// You might consider just using sessionStorage as it's more secure. tokens will be wiped when browswer closed
	bnzSecurity.service('localConfigService', function localConfigService($window) {
	      var self = this;

	      angular.extend(self, {
	        getItem: function getItem(key) {
	          var value = $window.sessionStorage.getItem(key);
	          try {
	            value = JSON.parse(value);
	          }
	          catch(e) {}
	          return value;
	        },

	        setItem: function setItem(key, value) {
	          $window.sessionStorage.setItem(key, JSON.stringify(value));
	        },

	        removeItem: function removeItem(key) {
	          $window.sessionStorage.removeItem(key);
	        }
	      });
	  });
  
  	  
})();