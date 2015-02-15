function GerenciadorBanco(){
	
	var events = require('events');
	var mysql = require('mysql');
	var connection = mysql.createConnection({
	  host     : 'localhost',
	  user: 'root',
	  password: 'ricardo',
	  database: 'teste',
	  multipleStatements: true
	});
	
	var gerenciadorBanco = this;
	this.eventEmitter = new events.EventEmitter();
	
	//define o numero de listeners associados a um EventEmitter. Como cada busca pelo nome de grupos adiciona um listener, deixei ilimitado. 
	//this.eventEmitter.setMaxListeners(0);
	
	
	this.verificarTipoUsuario = function verificarTipoUsuario(idUsuario){
		connection.query('SELECT tipo FROM usuarios WHERE id = ?',[idUsuario], function(err, result) {		
			if(err){
				gerenciadorBanco.eventEmitter.emit('fimVerificarTipoUsuario', -1);
			}
			else
				gerenciadorBanco.eventEmitter.emit('fimVerificarTipoUsuario', result[0].tipo);
		});	
	};
	
	
	
	function adicionarMembros(idGrupo, membros){
		var tiposMembro = {
			"Coordenador": 0,
			"Comum": 1
		};
		
		var membrosRestantes = new Array();
		
		for(var i=0; i < membros.length; i++){
			membrosRestantes.push(i);
		}
		
		
		for(var k=0; k < membros.length; k++){
			connection.query('INSERT INTO membros SET idUsuario = ?, idGrupo = ?, tipoMembro = ?',[membros[k].idUsuario, idGrupo, tiposMembro[membros[k].tipoMembro]], function(err, result) {		
				if(err) {
					//fazer algum tratamento
					membrosRestantes.pop();
					if(membrosRestantes.length == 0){
						gerenciadorBanco.eventEmitter.emit('membrosAdicionados');
					}
				}
				else{
					membrosRestantes.pop();
					if(membrosRestantes.length == 0){
						gerenciadorBanco.eventEmitter.emit('membrosAdicionados');
					}
				}
			});
		}	
		
	}
	
	this.inserirNovoGrupo = function (nomeGrupo, membros){
		var idGrupoNovo;
		
		connection.query('INSERT INTO grupos SET nome = ?',[nomeGrupo], function(err, result) {		
			if(err) {
				if(err.code == 'ER_NO_SUCH_TABLE'){ // se a tabela nao tiver sido criada
					connection.query(
						'CREATE TABLE grupos('+
							'id INT NOT NULL AUTO_INCREMENT,'+ 
							'nome VARCHAR(30) NOT NULL,'+ 
							'PRIMARY KEY (id)' +
						') ENGINE=InnoDB'
					);
					connection.query('INSERT INTO grupos SET nome = ?',[nomeGrupo], function(err, result) {
						if(err) console.log(err);
						else{
							idGrupoNovo = result.insertId;
							adicionarMembros(idGrupoNovo, membros);
							gerenciadorBanco.eventEmitter.once('membrosAdicionados', function(){ 
								gerenciadorBanco.eventEmitter.emit('grupoCriado', result.insertId);
							});
						}
					});
				}
				else //outro erro
					console.log(err);
			}
			else { 
				idGrupoNovo = result.insertId;
				adicionarMembros(idGrupoNovo, membros);
				gerenciadorBanco.eventEmitter.once('membrosAdicionados', function(){ 
					gerenciadorBanco.eventEmitter.emit('grupoCriado', result.insertId);
				});
			}
		});
	};
	
	function pesquisarNomeGrupo(idGrupo, indice){
		
		connection.query('SELECT nome FROM grupos WHERE id = ?',[idGrupo], function(err, result) {		
			if(err){
				gerenciadorBanco.eventEmitter.emit('fimPesquisaNomeGrupo' + indice, null, indice);
			}
			else{
				gerenciadorBanco.eventEmitter.emit('fimPesquisaNomeGrupo' + indice, result[0].nome, indice);
			}
		});	
	}
	
	
	this.obterGrupos = function obterGrupos(idUsuario){
		var grupos = new Array();
		
		connection.query('SELECT idGrupo FROM membros WHERE idUsuario = ? AND tipoMembro = ?',[idUsuario, 0], function(err, result) {		
			if(err) {
				if(err.code == 'ER_NO_SUCH_TABLE'){
					connection.query(
							'CREATE TABLE grupos('+
								'id INT NOT NULL AUTO_INCREMENT,'+ 
								'nome VARCHAR(30) NOT NULL,'+
								'PRIMARY KEY (id)'+
							') ENGINE=InnoDB'
					);
					connection.query(
						'CREATE TABLE membros(' +
							'idUsuario INT NOT NULL,'+
							'idGrupo INT NOT NULL,'+ 
							'tipoMembro INT NOT NULL,'+
							'FOREIGN KEY (idUsuario) REFERENCES usuarios (id)'+
							' ON DELETE CASCADE,'+
							' FOREIGN KEY (idGrupo) REFERENCES grupos (id)'+
							' ON DELETE CASCADE,'+
							'PRIMARY KEY (idUsuario,idGrupo)'+
						') ENGINE=InnoDB'
					);
					gerenciadorBanco.eventEmitter.emit('fimObterGrupos', grupos);
				}
				else{
					gerenciadorBanco.eventEmitter.emit('fimObterGrupos', grupos);
				}
			}
			else{ 
				for(var i=0; i < result.length; i++){
					grupos[i] = new Object();
					grupos[i].idGrupo = parseInt(result[i].idGrupo);
					
					pesquisarNomeGrupo(grupos[i].idGrupo, i);
					
					//.on pois eh para atender todos os eventos deste tipo
					gerenciadorBanco.eventEmitter.once('fimPesquisaNomeGrupo' + i, function retornoNomeGrupoPesquisado(nomeGrupo, indice){ 
						grupos[indice].nomeGrupo = nomeGrupo;
						
						// so vou emitir o termino de obterGrupos quando o nome do ultimo grupo tiver acabado de ser pesquisado.
						if(indice == result.length - 1)
							gerenciadorBanco.eventEmitter.emit('fimObterGrupos', grupos);
					});
				}
				
			}
		});	
	};
	
	
	/*
	 * Cadastra usuario comum com tipo 1 e coordenador com tipo 1.
	 */
	
	this.cadastrarUsuario = function cadastrarUsuario(usuario, password, nome, email, tipo){ 

		connection.query('INSERT INTO usuarios SET usuario = ?, password = ?, nome = ?, email = ?, tipo = ?',[usuario, password, nome, email, tipo], function(err, result) {
			if(err){
				if(err.code == 'ER_NO_SUCH_TABLE'){
					connection.query('CREATE TABLE usuarios(id INT NOT NULL AUTO_INCREMENT, usuario VARCHAR(30), password VARCHAR(7), nome VARCHAR(100), email VARCHAR(100), tipo INT NOT NULL, PRIMARY KEY (id) )');
					connection.query('INSERT INTO usuarios SET usuario = ?, password = ?, nome = ?, email = ?, tipo = ?',[usuario, password, nome, email, tipo], function(err, result) {
						if(err) gerenciadorBanco.eventEmitter.emit('fimCadastroUsuario', err.code);
						else gerenciadorBanco.eventEmitter.emit('fimCadastroUsuario', 1);
					});
				}
				else
					gerenciadorBanco.eventEmitter.emit('fimCadastroUsuario', err.code);
			}
			else gerenciadorBanco.eventEmitter.emit('fimCadastroUsuario', 1);
		});
	};
	
	
	
	this.excluirMapa = function excluirMapa (idMapa){
		
		connection.query('DELETE FROM mapas WHERE id = ?',[idMapa], function(err, result) {		
			if(err) {
				gerenciadorBanco.eventEmitter.emit('fimExclusaoMapa', err.code);
			}
			else{
				gerenciadorBanco.eventEmitter.emit('fimExclusaoMapa', 1);
			}
		});
		
	};
	
	

	this.perquisarMapas = function (idUsuario){
		
		var mapas = new Array();
		
		connection.query('SELECT idMapa,nomeMapa FROM permissoes WHERE idUsuario = ?',[idUsuario], function(err, result) {		
			if(err) {
				if(err.code == 'ER_NO_SUCH_TABLE'){
					connection.query(
							'CREATE TABLE mapas('+
								'id INT NOT NULL AUTO_INCREMENT,'+ 
								'nome VARCHAR(30) NOT NULL,'+
								'PRIMARY KEY (id)'+
							') ENGINE=InnoDB'
					);
					connection.query(
						'CREATE TABLE permissoes(' +
							'idUsuario INT NOT NULL,'+
							'idMapa INT NOT NULL,'+ 
							'nomeMapa VARCHAR(30) NOT NULL,'+
							'tipoPermissao INT NOT NULL,'+
							'FOREIGN KEY (idUsuario) REFERENCES usuarios (id)'+
							' ON DELETE CASCADE,'+
							' FOREIGN KEY (idMapa) REFERENCES mapas (id)'+
							' ON DELETE CASCADE,'+
							'PRIMARY KEY (idUsuario,idMapa)'+
						') ENGINE=InnoDB'
					);
					gerenciadorBanco.eventEmitter.emit('fimPesquisaMapas', mapas);
				}
				else{
					gerenciadorBanco.eventEmitter.emit('fimPesquisaMapas', mapas);
				}
			}
			else { 
				for(var i=0; i < result.length; i++){
					mapas[i] = new Object();
					mapas[i].idMapa = result[i].idMapa;
					mapas[i].nomeMapa = result[i].nomeMapa;
				}
				gerenciadorBanco.eventEmitter.emit('fimPesquisaMapas', mapas);
			}
		});	
	};
	
	
	function adicionarPermissoes(idMapa, nomeMapa, permissoes){
		var tiposPermissao = {
			"Gerente": 1,
			"Editor": 2,
			"Visualizador": 3
		};
		
		var permissoesRestantes = new Array();
		
		for(var i=0; i < permissoes.length; i++){
			permissoesRestantes.push(i);
		}
		
		
		for(var k=0; k < permissoes.length; k++){
			connection.query('INSERT INTO permissoes SET idUsuario = ?, idMapa = ?, nomeMapa = ?, tipoPermissao = ?',[permissoes[k].idUsuario, idMapa, nomeMapa, tiposPermissao[permissoes[k].tipoPermissao]], function(err, result) {		
				if(err) {
					//fazer algum tratamento
					permissoesRestantes.pop();
					if(permissoesRestantes.length == 0){
						gerenciadorBanco.eventEmitter.emit('permissoesAdicionadas');
					}
				}
				else{
					permissoesRestantes.pop();
					if(permissoesRestantes.length == 0){
						gerenciadorBanco.eventEmitter.emit('permissoesAdicionadas');
					}
				}
			});
		}	
		
	}

	
	this.inserirNovoMapa = function (nomeMapa, permissoes){
		var idMapaNovo;
		
		connection.query('INSERT INTO mapas SET nome = ?',[nomeMapa], function(err, result) {		
			if(err) {
				if(err.code == 'ER_NO_SUCH_TABLE'){ // se a tabela nao tiver sido criada
					connection.query(
						'CREATE TABLE mapas('+
							'id INT NOT NULL AUTO_INCREMENT,'+ 
							'nome VARCHAR(30) NOT NULL,'+ 
							'PRIMARY KEY (id)' +
						') ENGINE=InnoDB'
					);
					connection.query('INSERT INTO mapas SET nome = ?',[nomeMapa], function(err, result) {
						if(err) console.log(err);
						else{
							idMapaNovo = result.insertId;
							adicionarPermissoes(idMapaNovo, nomeMapa, permissoes);
							gerenciadorBanco.eventEmitter.once('permissoesAdicionadas', function(){ 
								gerenciadorBanco.eventEmitter.emit('mapaCriado', result.insertId);
							});
						}
					});
				}
				else
					console.log(err);
			}
			else { 
				idMapaNovo = result.insertId;
				adicionarPermissoes(idMapaNovo, nomeMapa, permissoes);
				gerenciadorBanco.eventEmitter.once('permissoesAdicionadas', function(){ 
					gerenciadorBanco.eventEmitter.emit('mapaCriado', result.insertId);
				});
			}
		});
	};
	
	
	this.buscarNomeTodosUsuarios = function(){
		connection.query('SELECT id,nome FROM usuarios', function(err, result) {
			var listaUsuarios;
			listaUsuarios = new Array();
			
			if(err) {
				gerenciadorBanco.eventEmitter.emit('nomeTodosUsuarios', {erro: err.code});
			}
			else { 
				for(var i=0; i < result.length; i++){
					listaUsuarios[i] = {
							id: result[i].id,
							nome: result[i].nome
					};
				}
				
				gerenciadorBanco.eventEmitter.emit('nomeTodosUsuarios', listaUsuarios);
			}
		});	
	};
	
	this.verificarTipoPermissao = function(idUsuario, idMapa){
		connection.query('SELECT tipoPermissao FROM permissoes WHERE idUsuario=? AND idMapa=?', [idUsuario, idMapa], function(err, result) {
			
			if(err) {
				//mensagem de erro ou usuario sem permissao
			}
			else { 
				gerenciadorBanco.eventEmitter.emit('tipoPermissao', result[0].tipoPermissao);
			}
		});	
	};
	
	//converte as permissoes de numero para palavras
	function converterPermissao(numTipoPermissao){
		var tiposPermissao = {
				0: "Administrador",
				1: "Gerente",
				2: "Editor",
				3: "Visualizador"
		};
		return tiposPermissao[numTipoPermissao];
	}
	
	function converterPermissaoParaNumero(nomeTipoPermissao){
		var tiposPermissao = {
				"Administrador": 0,
				"Gerente": 1,
				"Editor" : 2,
				"Visualizador": 3
		};
		return tiposPermissao[nomeTipoPermissao];
	}
	
	this.pesquisarUsuariosComPermissao = function pesquisarUsuariosComPermissao(idMapa){
		connection.query(
			'SELECT p.idUsuario, u.nome, p.tipoPermissao' +
			' FROM permissoes p, usuarios u' +
			' WHERE p.idMapa = ? AND p.idUsuario = u.id', [idMapa], function(err, result) {
			
			if(err) {
				return {erro: err.code};
			}
			else { 
				
				var listaUsuarios;
				listaUsuarios = new Array();
				
				//converter os tipos de permisssao de numeros para palavras
				for(var i=0; i < result.length; i++){
					listaUsuarios[i] = {
							id: result[i].idUsuario,
							nome: result[i].nome,
							tipoPermissao: converterPermissao(result[i].tipoPermissao)
					};
				}
				
				gerenciadorBanco.eventEmitter.emit('fimPesquisaUsuariosPermissao', listaUsuarios);
			}
		});	
	};
	
	this.buscarNomeMapa = function buscarNomeMapa(idMapa){
		connection.query('SELECT nome FROM mapas WHERE id = ?', [idMapa], function(err, result) {
			
			if(err) {
				return {erro: err.code};
			}
			else { 
				gerenciadorBanco.eventEmitter.emit('fimBuscaNomeMapa', result[0].nome);
			}
		});	
	};
	
	function alterarConfiguracoes(idMapa, nomeMapa, listaUsuariosPermitidos, novasPermissoes){
		//novasPermissoes e uma lista de objetos com duas propriedades: idUsuario em int e tipoPermissao em string
		//listaUsuariosPermitidos e uma lista com id do usuario em int, nome do usuario e tipoPermissao do usuario em string
		
		var transacao;
		var estaNaLista;
		
		transacao = 
			"SET autocommit = 0;" +
			" START TRANSACTION;" +
			" UPDATE mapas SET nome='" + nomeMapa + "' WHERE id=" + idMapa + ";" +
			" UPDATE permissoes SET nomeMapa='" + nomeMapa + "' WHERE idMapa=" + idMapa + ";"
		;
		
		// Para cada membro da lista novasPermissoes, ou seja, das permissoes alteradas pelo usuario, verificar:
		// Se o usuario ja possuia permissao, verificar se foi alterado o tipo,
		// se o usuario nao possuia permissao, adicionar,
		// se o usuario esta na lista antiga, mas nao na nova, deleta-lo.
		 
		for(var i=0; i < novasPermissoes.length; i++){
			estaNaLista = false;
			
			for(var j=0; j< listaUsuariosPermitidos.length && !estaNaLista; j++){
				if(novasPermissoes[i].idUsuario == listaUsuariosPermitidos[j].id){
					estaNaLista = true;
					if(novasPermissoes[i].tipoPermissao != listaUsuariosPermitidos[j].tipoPermissao){ //so altera se diferente
						transacao += 
							" UPDATE permissoes SET tipoPermissao=" + 
							converterPermissaoParaNumero(novasPermissoes[i].tipoPermissao) +
							" WHERE idUsuario=" + novasPermissoes[i].idUsuario + 
							" AND idMapa=" + idMapa + ";"
						;
					}
					listaUsuariosPermitidos.splice(j,1);
				}
			}
			
			if(!estaNaLista){ //usuario completamente novo
				transacao += 
					" INSERT INTO permissoes SET idUsuario =" + novasPermissoes[i].idUsuario +
					", idMapa =" + idMapa +
					", nomeMapa ='" + nomeMapa + "'" +
					", tipoPermissao =" + converterPermissaoParaNumero(novasPermissoes[i].tipoPermissao) +
					";"
				;
			}
		}
		
		if(listaUsuariosPermitidos.length > 0){ //permissoes a serem deletadas
			for(var j=0; j < listaUsuariosPermitidos.length; j++){
				transacao += 
					" DELETE FROM permissoes WHERE idUsuario=" + listaUsuariosPermitidos[j].id +
					" AND idMapa=" + idMapa + ";"
				;
			}
		}
		
		
		//Aplicando a transacao
		connection.query(transacao, function(err, result) {
			if(err)
				gerenciadorBanco.eventEmitter.emit('fimAlterarConfiguracoesMapa', {erro: err.code});
			else
				gerenciadorBanco.eventEmitter.emit('fimAlterarConfiguracoesMapa', "Alteracoes realizadas com sucesso!");
		});	
		
	}
	
	
	this.configurarMapa = function configurarMapa(idMapa, nomeMapa, idUsuario, permissoes){
		//permissoes e uma lista de objetos com duas propriedades: idUsuario em int e tipoPermissao em string
		
		if(idMapa){ //se o usuario nao apagou o id do mapa na pagina configurarMapa.ejs
			idMapa = parseInt(idMapa);
			
			gerenciadorBanco.pesquisarUsuariosComPermissao(idMapa);
			gerenciadorBanco.eventEmitter.once('fimPesquisaUsuariosPermissao', function(resultado){ 
				
				if(resultado.erro){ //erro na busca dos usuarios com permissao
					gerenciadorBanco.eventEmitter.emit('fimConfigurarMapa', {erro: resultado.erro});
				}
				else{ //sucesso na busca dos usuarios com permissao
					
					var listaUsuariosPermitidos;
					listaUsuariosPermitidos = resultado;
					
					//necessario saber a permissao do usuario, pois so administrador e gerente podem mudar permissoes
					var i=0;
					while( i < listaUsuariosPermitidos.length && listaUsuariosPermitidos[i].id != idUsuario)
						i++;
					
					if( i<listaUsuariosPermitidos.length && (listaUsuariosPermitidos[i].tipoPermissao == "Gerente" || listaUsuariosPermitidos[i].tipoPermissao == "Administrador") ){
						alterarConfiguracoes(idMapa, nomeMapa, listaUsuariosPermitidos, permissoes);
						gerenciadorBanco.eventEmitter.once('fimAlterarConfiguracoesMapa', function(resultado){ 
							if(resultado.erro){
								connection.query(" ROLLBACK");
								gerenciadorBanco.eventEmitter.emit('fimConfigurarMapa', {erro: "Alteracoes nao aplicadas, devido ao seguinte erro: " + resultado.erro}); 
							}
							else{
								connection.query(" COMMIT");
								gerenciadorBanco.eventEmitter.emit('fimConfigurarMapa', resultado);
							}
						});
						
					}
					else{ //ou nao esta na lista ou nao tem permissao de Adm ou gerente
						gerenciadorBanco.eventEmitter.emit('fimConfigurarMapa', {erro: "Voce nao tem permissao para configurar este mapa!"}); 
					}
				}
			});
		}
		else{ //usuario apagou id do mapa
			gerenciadorBanco.eventEmitter.emit('fimConfigurarMapa', {erro: "O id do mapa foi apagado!"}); 
		}
	};

}

module.exports = GerenciadorBanco;
