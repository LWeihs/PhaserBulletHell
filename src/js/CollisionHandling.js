function handleHitPlayer(game, player, game_state) {
    if (player.isInvincible()) {
        return;
    }
    game_state.addToLives(-1);
    player.triggerInvincibility(game);
}

/*---------------------------------------------------------------------------*/

function handleEnemyHit(bullet_sprite, enemy) {
    enemy.applyDamage(bullet_sprite.damage);
    bullet_sprite.destroy();
}

/*---------------------------------------------------------------------------*/

export {
    handleHitPlayer,
    handleEnemyHit,
}