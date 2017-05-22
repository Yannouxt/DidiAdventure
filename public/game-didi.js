/* Mise en place de la librairie */

var Q = new Quintus({
	development: true// On lance le développement, pour forcer le refresh des assets (images, fichiers JSON…)
}).include([ // On indique quels composants inclure de base
	Quintus.Sprites, // Pour gérer les sprites (les calques en gros)
	Quintus.Scenes, // Pour gérer les scenes (les différentes pages, pour faire simple)
	Quintus.Anim, // Pour gérer les animations (sur des sprites, par exemple)
	Quintus['2D'], // Pour gérer la 2D : permet d'avoir des ennemis qui se déplacent et de détecter les collisions automatiquement
	Quintus.Input, // Pour gérer les contrôles (certains contrôles sont inclus de base, c'est assez pratique)
	Quintus.Touch, // Pour gérer les contrôles via une surcouche tactile (avec un joypad si nécessaire — c'est paramétrable)
	Quintus.UI, // Pour afficher des boutons, du texte, etc.
    Quintus.TMX,
    Quintus.Audio
]).setup('game', { // On paramètre un peu le tout (le premier paramètre permet d'indiquer le canvas, vous pouvez aussi passer directement un élément du DOM ou ne rien spécifier si vous voulez que la librairie crée un canvas pour vous)
	maximize: false, // Inutile de modifier la taille du canvas (`true` permet d'étendre à toute la surface disponible)
	width: 1000, // Largeur de base
	height: 800 // Hauteur de base
}).controls().touch(); // On initialise la gestion des contrôles et la couche tactile qui va avec

Q.enableSound();
console.log('Quintus est prêt !');



//*********************************MENU*****************************************************//

Q.scene('startGame', function(stage) { // On crée une nouvelle scène que l'on nomme. Une fois affichée la fonction sera appelée, avec en paramètre notre objet scène (dont on récupèrera quelques infos et auquel on balancera quelques objets)

	var img_bg = new Q.Sprite({ x: Q.width/2, y: Q.height/2, w: Q.width, h: Q.height, tileW: Q.width, tileH: Q.width, asset: 'BG.png'}); // On peut ajouter une image de fond, avec un petit dessin par exemple
	stage.insert(img_bg); // Ne pas oublier d'insérer l'image (à noter que vous pouvez tout faire sur une seule ligne, comme pour le texte juste en-dessous)
    
    var img_menu = new Q.Sprite({ x: Q.width/2, y: Q.height/2, w: Q.width/2, h: Q.height, tileW: Q.width, tileH: Q.width, asset: 'menu.png'});
    stage.insert(img_menu);
    
	var container = stage.insert(new Q.UI.Container({x: Q.width/1.91, y: Q.height/3,}));
    var button = container.insert(new Q.UI.Button({x:0, y: 0, scale:0.6, asset: 'Button_start.png'}));
    button.on('click', function() { // On place un écouteur sur le bouton pour gérer le clic
		Q.clearStages(); // On vide les scènes affichées, pour repartir sur un canvas vierge
		console.log('Bouton cliqué, lancement du jeu…'); // Regardez votre console ;)
        prepareLevel();
		Q.stageScene('game'); // On affiche une autre scène (qui sera crée dans la partie 3) au rang 0, soit tout en bas dans la pile des calques
	});
    
    
    Q.audio.play("my_song.mp3");
	console.log('Écran de lancement affiché');
});

//***************************************************************************************//



//**********************CHARGEMENT***********************************//

Q.loadTMX("menu.png,BG.png,Button_start.png, my_song.mp3,player-sprite.png,sprites.png,test.png,stage2.tmx", function() {
	Q.stageScene('startGame', 0); // On affiche notre scène
    Q.sheet('my_player', 'player-sprite.png', { tileW: 100, tileH: 156}); // On crée la feuille du joueur, qui permet de décomposer les états (pour l'animer par exemple)
    Q.animations('my_player', {
        stand: { frames: [0], rate: 1/15, next: 'stand' },
        walk_left: { frames: [0,1,2,4,5,6,3,7,8,7], rate: 1/5, flip : 'x' },
        walk_right: { frames: [0,1,2,4,5,6,3,7,8,7], rate: 1/5, flip : false},
        jump: { frames: [2], rate: 1/60 },

    }, 
                 {
	progressCallback: function(loaded, total) {
		console.log('Chargement : ' + Math.floor(loaded/total*100) + '%');
	}
});
});

//********************************************************************//

    var gamestarted = false;
    var players = [];
    var socket = io.connect('http://localhost:8080');
    var UiPlayers = document.getElementById("players");
    var playerid = 0;


//*******************NIVEAU 1 ***************************************//

function prepareLevel(){
console.log("Prepare Level");
Q.scene('game', function(stage) {
    console.log('Niveau 1 ! ');
    

    console.log("Je passe quand je veux !");
    stage.insert(new Q.Repeater({ asset: 'BG.png', speedX: 0.5})); // L'image ne se répète qu'à la verticale et avance moitié moins vite que le joueur
    Q.stageTMX("stage2.tmx",  stage);
    
    
    setUp(stage);
    
    function setUp (stage) {
        socket.on('count', function (data) {
            UiPlayers.innerHTML = 'Players: ' + data['playerCount'];
        });
        
        //socket.on('connected', function (data) {
            console.log("Je suis dans la creation du perso!");
            selfId = playerid;
            playerid++;
            player = new Q.Player({playerId: selfId,x: 100, y: 100, socket: socket });
            stage.insert(player);
            stage.add("viewport").follow(Q("Player").first(),{x: true, y : false},{minX : 0 });
        
          socket.on('updated', function (data) {
            var actor = players.filter(function (obj) {
                    return obj.playerId == data['playerId'];
                })[0];
            if (actor) {
                actor.player.p.x = data['x'];
                actor.player.p.y = data['y'];
                actor.player.p.sheet = data['sheet'];
                actor.player.p.update = true;
                actor.player.p.sprite = data['sprite'];
                actor.player.p.scale = data['scale'];
                actor.player.p.speed = data['speed'];
                actor.player.p.jumpSpeed = data['jumpSpeed'];
  } else {
    var temp = new Q.Actor({ playerId: data['playerId'], x: data['x'], y: data['y'], sheet: data['sheet'], scale : 0.6, sprite : data['sprite'] });
    players.push({ player: temp, playerId: data['playerId'] });
    stage.insert(temp);
  }
});

        //});
    };
    
});
};
    
    

    


    


//******************************************************************//



//*****************PLAYER******************************//
Q.Sprite.extend('Player',{
    init: function(p) {
        this._super(p, {
            sheet: 'my_player',
            sprite: 'my_player', // On indique le sprite
            speed: 300,
            jumpSpeed: -500, // Pour sauter plus haut, on diminue la valeur
            type: Q.SPRITE_PLAYER,
            direction: null, // Par défaut il n'y a pas de direction, notre joueur est statique
            scale : 0.6
        });

        this.add('2d, platformerControls, animation'); // Remplacer la ligne dans le *constructeur* pour ajouter le composant animation

        this.play('stand');
    },
    step: function(dt) {
        this.p.socket.emit('update', { playerId: this.p.playerId, x: this.p.x, y: this.p.y, sheet: this.p.sheet });
    // Si on a appuyé sur le bouton pour sauter, on joue l'animation de saut (et on sort de la méthode pour gagner du temps)
    if (Q.inputs['up']) {
        this.play('jump');
        return;
    }
    if (this.p.x <= 0) {
        this.p.x = 0;
    }
    // On calcule la variation horizontale pour savoir dans quel sens on bouge
    if (this.p.vx > 0) {
        this.p.direction = 'right';
    }
    else if (this.p.vx < 0) {
        this.p.direction = 'left';
    }
    else {
        this.p.direction = null; // Si aucune variation, pas de direction : joueur immobile
    }

    if (this.p.direction) {
        this.play('walk_' + this.p.direction); // On joue l'animation qui correspond à notre direction le cas échéant
    }
    else {
        this.play('stand'); // Sinon on affiche un joueur immobile
    }
}

});

//******************Other players *********************//
Q.Sprite.extend('Actor', {
  init: function (p) {
    this._super(p, {
      update: true
    });
 
    var temp = this;
    setInterval(function () {
      if (!temp.p.update) {
        temp.destroy();
      }
      temp.p.update = false;
    }, 3000);
  }
});



