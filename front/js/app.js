angular.module('huntApp', ['ngRoute'])
.run(function($rootScope, $http, $timeout) {
  $rootScope.beginSearch = function() {
    $http.get('/api/manual-search');
    $rootScope.waitForHunt = true;
    $timeout(function() {
      $rootScope.waitForHunt = false;
    }, 20000);
  };
})
.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'templates/list_hunts.html',
      controller: 'listHuntsCtrl'
    })
    .when('/new-hunt', {
      templateUrl: 'templates/add_hunt.html',
      controller: 'addHuntCtrl'
    })
    .when('/hunt/:id', {
      templateUrl: 'templates/show_hunt.html',
      controller: 'showHuntCtrl'
    })
    .otherwise({
      redirectTo: '/'
    });
})
.service('huntService', ['$http', function($http) {

  this.getHunts = function() {
    return $http.get('/api/hunt');
  };

  this.getHunt = function(id) {
    var hs = this;
    return new Promise(function(resolve, reject) {
      hs.getHunts()
        .then(function(success) {
          resolve(success.data.filter(function(h) { return h._id === id})[0]);
        });
    });
  };

  this.beginHunt = function(hunt) {
    return $http.post('/api/hunt', hunt);
  };

  this.removeHunt = function(hunt) {
    return $http.delete('/api/hunt/'+hunt._id);
  };

}])
.service('matchService', ['$http', function($http) {

  this.deleteMatch = function(hunt, match) {
    $http.put('/api/hunt/'+hunt._id+'/match/retire', {
      huntId: hunt._id,
      deleted: match.href
    });
  };

  this.favoriteMatch = function(hunt, match) {
    return $http.put('/api/hunt/'+hunt._id+'/match/favorite', {
      href: match.href,
      favorite: !match.favorite
    });
  };

}])
.controller('listHuntsCtrl', ['$scope', 'huntService', function($scope, huntService) {

  $scope.init = function() {
    huntService.getHunts()
      .then(function(success) {
        $scope.hunts = success.data;
        $scope.hunts.forEach(function(h) {
          h.favorites = h.matches.filter(function(m) { return m.favorite });
        });
      });
  }

  $scope.removeHunt = function(hunt) {
    huntService.removeHunt(hunt)
      .then(function(success) {
        $scope.hunts = $scope.hunts.filter(function(h) { return h !== hunt });
      });
  }

  $scope.init();

}])
.controller('addHuntCtrl', ['$scope', 'huntService', function($scope, huntService) {
  $scope.beginHunt = function() {
    huntService.beginHunt($scope.newHunt)
      .then(function(success) {
        $scope.added = {title: $scope.newHunt.title};
        $scope.newHunt = {};
      });
  };
}])
.controller('showHuntCtrl', ['$scope', '$routeParams', 'huntService', 'matchService', function($scope, $routeParams, huntService, matchService) {

  function init() {
    huntService.getHunt($routeParams.id)
      .then(function(hunt) {
        $scope.hunt = hunt;
        $scope.$apply();
      });
  }
  $scope.favoriteMatch = function(match) {
    matchService.favoriteMatch($scope.hunt, match);
    match.favorite = !match.favorite;
  };
  $scope.deleteMatch = function(match) {
    matchService.deleteMatch($scope.hunt, match);
    $scope.hunt.matches = $scope.hunt.matches.filter(function(m) { return m !== match });
  };
  
  init();
}]);
