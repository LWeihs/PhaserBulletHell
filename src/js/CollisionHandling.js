function handleHitPlayer(game, player) {
    if (player.isInvincible()) {
        return;
    }
    player.addToLives(-1);
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