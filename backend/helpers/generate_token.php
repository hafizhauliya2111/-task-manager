<?php

function generateToken(){
    $token = bin2hex(random_bytes(16));
    return $token;
}