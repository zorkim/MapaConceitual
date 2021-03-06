function GerenciadorSemiLigacao(){
    
    var semiLigacao = this;
    
    /**
     * 
     */
    this.desenharSemiLigacao = function( conceitoContainerP, ligacaoContainerP ) {
    	var conceitoContainer;
    	var ligacaoContainer;
    	
    	
    	conceitoContainer = conceitoContainerP;
    	ligacaoContainer = ligacaoContainerP;
    	
    	return desenharLinha(ligacaoContainer, conceitoContainer);
    };

    
    /**
     * 
     */
     function desenharLinha(ligacaoContainer, conceitoContainer) {
    	var coordenadasLinha;
    	var graphic;
    	var linhaContainer;
    	var espessuraLinha;
    	var corLinha;
    	
    	coordenadasLinha = calcularNovaPonta(conceitoContainer,ligacaoContainer);
    	
    	linhaContainer = new createjs.Shape(); 
    	
    	graphic = new createjs.Graphics(); //define as propriedades graficas da linha
    	
    	espessuraLinha = 1;
    	corLinha = "#000";
    	
    	graphic.setStrokeStyle(espessuraLinha,"round").beginStroke(corLinha);
    	
    	graphic.moveTo(coordenadasLinha.conceito.x,coordenadasLinha.conceito.y);
    	graphic.lineTo(coordenadasLinha.ligacao.x,coordenadasLinha.ligacao.y);
    	
    	linhaContainer.graphics = graphic;
    	
    	return linhaContainer;
    };
    
    /**
     * calcula os novos pontos de interconexao entre conceitos e palavras de ligacao conectados
     */
    
    function calcularNovaPonta(conceitoContainer, ligacaoContainer){
    	var coordenadas = new Coordenadas(new Array(),new Array());
    	var coordenadasFinais = new Coordenadas(new Object(),new Object());
    	var conceitoX = parseFloat(conceitoContainer.x);
    	var conceitoY = parseFloat(conceitoContainer.y);
    	var ligacaoX = parseFloat(ligacaoContainer.x);
    	var ligacaoY = parseFloat(ligacaoContainer.y);
    	
    	var larguraConceito = conceitoContainer.getBounds().width;
    	var alturaConceito = conceitoContainer.getBounds().height;
    	var larguraLigacao = ligacaoContainer.getBounds().width;
    	var alturaLigacao = ligacaoContainer.getBounds().height;
    	
    	
    	for(var i=0;i<8;i++){
    		coordenadas.conceito[i] = new Object();
    		coordenadas.ligacao[i] = new Object();
    	}
    	
    	//para o conceito
    	coordenadas.conceito[0].x = conceitoX;
    	coordenadas.conceito[0].y = conceitoY;
    	
    	coordenadas.conceito[1].x = conceitoX + (larguraConceito/2);
    	coordenadas.conceito[1].y = conceitoY;
    	
    	coordenadas.conceito[2].x = conceitoX + (larguraConceito);
    	coordenadas.conceito[2].y = conceitoY;
    	
    	coordenadas.conceito[3].x = conceitoX + (larguraConceito);
    	coordenadas.conceito[3].y = conceitoY + (alturaConceito/2);
    	
    	coordenadas.conceito[4].x = conceitoX + (larguraConceito);
    	coordenadas.conceito[4].y = conceitoY + (alturaConceito);
    	
    	coordenadas.conceito[5].x = conceitoX + (larguraConceito/2);
    	coordenadas.conceito[5].y = conceitoY + (alturaConceito);
    	
    	coordenadas.conceito[6].x = conceitoX;
    	coordenadas.conceito[6].y = conceitoY + (alturaConceito);
    	
    	coordenadas.conceito[7].x = conceitoX;
    	coordenadas.conceito[7].y = conceitoY + (alturaConceito/2);
    	
    	//para a ligacao
    	coordenadas.ligacao[0].x = ligacaoX;
    	coordenadas.ligacao[0].y = ligacaoY;
    	
    	coordenadas.ligacao[1].x = ligacaoX + (larguraLigacao/2);
    	coordenadas.ligacao[1].y = ligacaoY;
    	
    	coordenadas.ligacao[2].x = ligacaoX + (larguraLigacao);
    	coordenadas.ligacao[2].y = ligacaoY;
    	
    	coordenadas.ligacao[3].x = ligacaoX + (larguraLigacao);
    	coordenadas.ligacao[3].y = ligacaoY + (alturaLigacao/2);
    	
    	coordenadas.ligacao[4].x = ligacaoX + (larguraLigacao);
    	coordenadas.ligacao[4].y = ligacaoY + (alturaLigacao);
    	
    	coordenadas.ligacao[5].x = ligacaoX + (larguraLigacao/2);
    	coordenadas.ligacao[5].y = ligacaoY + (alturaLigacao);
    	
    	coordenadas.ligacao[6].x = ligacaoX;
    	coordenadas.ligacao[6].y = ligacaoY + (alturaLigacao);
    	
    	coordenadas.ligacao[7].x = ligacaoX;
    	coordenadas.ligacao[7].y = ligacaoY + (alturaLigacao/2);
    	
    	
    	if(ligacaoY >= coordenadas.conceito[6].y){ //pontaLigacao[1] � pontaConceito[5]
    		
    		coordenadasFinais.conceito.x = coordenadas.conceito[5].x;
    		coordenadasFinais.conceito.y = coordenadas.conceito[5].y;
    		coordenadasFinais.ligacao.x = coordenadas.ligacao[1].x;
    		coordenadasFinais.ligacao.y = coordenadas.ligacao[1].y;
    		return coordenadasFinais;
    	}
    	if(ligacaoY < coordenadas.conceito[6].y && coordenadas.ligacao[4].x <= conceitoX){ //pontaLigacao[3] � pontaConceito[7]
    		
    		coordenadasFinais.conceito.x = coordenadas.conceito[7].x;
    		coordenadasFinais.conceito.y = coordenadas.conceito[7].y;
    		coordenadasFinais.ligacao.x = coordenadas.ligacao[3].x;
    		coordenadasFinais.ligacao.y = coordenadas.ligacao[3].y;
    		return coordenadasFinais;
    	}
    	if(coordenadas.ligacao[5].y <= conceitoY){ //pontaLigacao[5] � pontaConceito[1]
    		
    		coordenadasFinais.conceito.x = coordenadas.conceito[1].x;
    		coordenadasFinais.conceito.y = coordenadas.conceito[1].y;
    		coordenadasFinais.ligacao.x = coordenadas.ligacao[5].x;
    		coordenadasFinais.ligacao.y = coordenadas.ligacao[5].y;
    		return coordenadasFinais;
    	}
    	if(coordenadas.ligacao[6].y > conceitoY && coordenadas.ligacao[4].x >= conceitoX){ //pontaLigacao[3] � pontaConceito[7]
    		
    		coordenadasFinais.conceito.x = coordenadas.conceito[3].x;
    		coordenadasFinais.conceito.y = coordenadas.conceito[3].y;
    		coordenadasFinais.ligacao.x = coordenadas.ligacao[7].x;
    		coordenadasFinais.ligacao.y = coordenadas.ligacao[7].y;
    		return coordenadasFinais;
    	}	
    }
    
    
    this.getIdConceito = function(){
    	return idConceito
    };
    
    this.getIdLigacao = function(){
    	return idLigacao;
    };
    
    this.getIdLinha = function(){
    	return mapaConceitual.getStageCanvas().getChildIndex(linhaContainer);
    }
    
    
    this.getLinhaContainer = function(){
        return linhaContainer;
    };
}