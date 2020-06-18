function handleHitPlayer(game, player, game_state) {
    if (player.isInvincible()) {
        return;
    }
    game_state.addToLives(-1);
    player.triggerInvincibility(game);
}

/*---------------------------------------------------------------------------*/

function handleEnemyHit(bullet) {
    bullet.destroy();
}

/*---------------------------------------------------------------------------*/

export {
    handleHitPlayer,
    handleEnemyHit,
}