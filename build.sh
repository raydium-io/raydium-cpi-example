#!/bin/bash

cd amm-cpi && anchor build && cd ..
cd clmm-cpi && anchor build && cd ..
cd cp-swap-cpi && anchor build 