function Passport(connection, operadorSql){
	
	this.ppt = require('passport');
	var localStrategy = require('passport-local').Strategy;
	
	function bb(usuario,password, connection,done){
		var query;
		var callback;
		
		query = "SELECT id,usuario,password FROM usuarios WHERE usuario = " + connection.escape(usuario) +" AND password = " + connection.escape(password);
		callback = function(err, result) {		
			
			if(err){
				return done(err, false);
			}
			else { 
				if(result.length>0){
					var user = new Object();
					user.id = result[0].id;
					user.usuario = result[0].usuario;
					user.password = result[0].password;
					
					return done(null, user);
				}
				else
					return done(null, false);
			}
		}
		operadorSql.addSql(query, callback);
	}
	
	
	this.verificarAutenticacao = function(req, res, next) {
		if (req.isAuthenticated()) { return next(); }
		else return res.redirect('/');
	};
	
	
	// serialize user to session
	this.ppt.serializeUser(function(user, done) {
		return done(null, user.id);
	});
	
	// find user in MySQL database
	this.ppt.deserializeUser(function(id, done) {
		connection.query('SELECT usuario,password FROM usuarios WHERE id = ?',[id], function(err, result) {
			var user = new Object();
			user.id = id;
			user.usuario = result[0].usuario;
			user.password = result[0].password;
			return done(err, user);
		});
		
	});

	
	
	//this e necessario, pois quando a classe e exportada para app, as variaveis desta classe que nao possuem o this sao tratadas como variaveis da classe app, retornando que nao estao definidas.
	this.ppt.use('local',new localStrategy(
			{
				usernameField: 'usuario',
				passwordField: 'password'    
			},
			function(usuario,password,done) {
				bb(usuario,password,connection,done);	
			}
	));
}

module.exports = Passport;
