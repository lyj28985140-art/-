/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, X, Lock, Trophy } from "lucide-react";

export default function App() {
  const [screen, setScreen] = useState<"start" | "next">("start");
  const [showGif, setShowGif] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [enemyX, setEnemyX] = useState(110);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [maxPlayerHealth, setMaxPlayerHealth] = useState(100);
  const [isDead, setIsDead] = useState(false);
  const [enemyActive, setEnemyActive] = useState(true);
  const [isEnemyHit, setIsEnemyHit] = useState(false);
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);
  const [inventory, setInventory] = useState<string[]>([]);
  const [equippedItems, setEquippedItems] = useState<string[]>([]);
  const [potionInventory, setPotionInventory] = useState<{ id: string; count: number }[]>([]);
  const [inventoryTab, setInventoryTab] = useState<"accessory" | "potion">("accessory");
  const [showInventory, setShowInventory] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [gibonLevel, setGibonLevel] = useState(0);
  const [bubuLevel, setBubuLevel] = useState(0);
  const [droppedCoins, setDroppedCoins] = useState<{ id: number; x: number; y: number; flying: boolean }[]>([]);
  const [droppedItems, setDroppedItems] = useState<{ id: number; x: number; y: number; itemId: string; flying: boolean }[]>([]);
  const [droppedGems, setDroppedGems] = useState<{ id: number; x: number; y: number; flying: boolean }[]>([]);
  const [droppedEx, setDroppedEx] = useState<{ id: number; x: number; y: number; amount: number; flying: boolean }[]>([]);
  const [timedBuffs, setTimedBuffs] = useState<{ pp1: number; pp2: number; pp3: number }>({ pp1: 0, pp2: 0, pp3: 0 });
  const [gibonCooldown, setGibonCooldown] = useState(0);
  const [gibonProjectiles, setGibonProjectiles] = useState<{ id: number; x: number; y: number; hit?: boolean }[]>([]);
  const [kills, setKills] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [killsInChapter, setKillsInChapter] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerEx, setPlayerEx] = useState(0);
  const [isBoss, setIsBoss] = useState(false);
  const [maxEnemyHealth, setMaxEnemyHealth] = useState(100);
  const [showClear, setShowClear] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false);
  const [showBossMenu, setShowBossMenu] = useState(false);
  const [currentBossStage, setCurrentBossStage] = useState(0);
  const [isInBossBattle, setIsInBossBattle] = useState(false);
  const [bossHealth, setBossHealth] = useState(0);
  const [maxBossHealth, setMaxBossHealth] = useState(0);
  const [completedBossStages, setCompletedBossStages] = useState<number[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([]);
  const achievements = [
    { id: 'level5', title: '레벨 5 달성', description: '레벨 5에 도달하세요.', condition: (lv: number) => lv >= 5, reward: { type: 'coins' as const, amount: 10000, label: '10,000 코인' } },
    { id: 'level10', title: '레벨 10 달성', description: '레벨 10에 도달하세요.', condition: (lv: number) => lv >= 10, reward: { type: 'potion' as const, id: 'pp3', amount: 2, label: '공격증가 물약 2개' } },
    { id: 'level20', title: '레벨 20 달성', description: '레벨 20에 도달하세요.', condition: (lv: number) => lv >= 20, reward: { type: 'item' as const, id: 'zbb', label: '전설의 반지 zbb' } },
  ];

  const claimAchievement = (id: string) => {
    const ach = achievements.find(a => a.id === id);
    if (!ach || claimedAchievements.includes(id)) return;
    if (!ach.condition(playerLevel)) return;

    if (ach.reward.type === 'coins') {
      setCoins(prev => prev + ach.reward.amount!);
    } else if (ach.reward.type === 'potion') {
      setPotionInventory(prev => {
        const existing = prev.find(p => p.id === ach.reward.id);
        if (existing) {
          return prev.map(p => p.id === ach.reward.id ? { ...p, count: p.count + ach.reward.amount! } : p);
        }
        return [...prev, { id: ach.reward.id!, count: ach.reward.amount! }];
      });
    } else if (ach.reward.type === 'item') {
      setInventory(prev => [...prev, ach.reward.id!]);
    }
    setClaimedAchievements(prev => [...prev, id]);
  };
  const [damageEffects, setDamageEffects] = useState<{ id: number, x: number, y: number, value: number, color: string }[]>([]);
  const [bossSkills, setBossSkills] = useState<{ id: number, x: number, type: 'primary' | 'secondary' }[]>([]);

  const [playerIsHit, setPlayerIsHit] = useState(false);
  const lastDamageTimeRef = useRef(0);

  const spawnDamageEffect = (x: number, y: number, value: number, color: string) => {
    const id = Date.now() + Math.random();
    setDamageEffects(prev => [...prev.slice(-10), { id, x, y, value, color }]);
    setTimeout(() => {
      setDamageEffects(prev => prev.filter(eff => eff.id !== id));
    }, 800);
  };

  // Main tick for both regular and boss combat
  useEffect(() => {
    if (isPaused || screen !== "next" || isDead) return;
    if (showShop || showInventory || showUpgrades || showBossMenu) return;

    const tick = setInterval(() => {
      // Player Regen
      let regenAmount = 0;
      if (equippedItems.includes('item3')) regenAmount += 10;
      if (equippedItems.includes('tt2')) regenAmount += 20;
      if (equippedItems.includes('bdd2')) regenAmount += 40;
      
      if (regenAmount > 0) {
        setPlayerHealth(prev => Math.min(maxPlayerHealth, prev + regenAmount));
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [isPaused, screen, isDead, showShop, showInventory, showUpgrades, showBossMenu, isInBossBattle, currentBossStage, maxPlayerHealth, equippedItems, enemyActive]);

  // Handle Boss Death
  useEffect(() => {
    if (isInBossBattle && bossHealth <= 0) {
      setIsInBossBattle(false);
      setCompletedBossStages(prev => [...new Set([...prev, currentBossStage])]);
      setCoins(c => c + (currentBossStage * 2000));
      setGems(g => g + (currentBossStage * 50));
      awardEx(currentBossStage * 500);

      // Special drops for Boss Stage 1
      if (currentBossStage === 1) {
        dropItems('bdd1');
        dropItems('bdd2');
      }

      // Reset enemy stats for normal mobs
      setEnemyHealth(maxEnemyHealth);
      setEnemyActive(true);
    }
  }, [bossHealth, isInBossBattle, currentBossStage, maxEnemyHealth]);


  // Boss Skill Effect (0.5s check, 100% chance)
  useEffect(() => {
    if (isPaused || screen !== "next" || isDead || !isInBossBattle || currentBossStage !== 1) return;
    if (showShop || showInventory || showUpgrades || showBossMenu) return;

    const skillCheck = setInterval(() => {
      // Trigger at Boss current X position (15% chance)
      if (Math.random() < 0.15) {
        const skillId = Date.now();
        const currentX = enemyXRef.current;
        
        // Primary effect (bbosskkill1)
        setBossSkills(prev => [...prev, { id: skillId, x: currentX, type: 'primary' }]);
        
        setTimeout(() => {
          setBossSkills(prev => prev.filter(s => s.id !== skillId));
        }, 1000);

        // Secondary effect (bbskill1) after 0.4s
        setTimeout(() => {
          const secondId = Date.now() + 1;
          // Capture latest X for the secondary effect so it follows the boss
          const latestX = enemyXRef.current;
          // Positioned significantly left so the right edge of the 1500px video overlaps the boss center
          // 1500px is roughly 75-80% of typical screen width; setting center to latestX - 45
          setBossSkills(prev => [...prev, { id: secondId, x: latestX - 45, type: 'secondary' }]);
          
          setTimeout(() => {
            setBossSkills(prev => prev.filter(s => s.id !== secondId));
          }, 1000);
        }, 400);
      }
    }, 500);

    // Damage over time for secondary skill (0.3s interval, 1 damage)
    const damageTick = setInterval(() => {
      if (isPaused || isDead || !isInBossBattle) return;
      
      setBossSkills(current => {
        const secondarySkills = current.filter(s => s.type === 'secondary');
        // Very wide hitbox to match the massive visual span (covering almost the entire screen)
        const isTouching = secondarySkills.some(s => Math.abs(s.x - 22) < 95); 
        
        if (isTouching) {
          setPlayerHealth(prev => {
            const next = Math.max(0, prev - 15);
            if (next <= 0) setTimeout(() => setIsDead(true), 50);
            return next;
          });
          spawnDamageEffect(22, 50, 15, "text-red-400 font-bold text-sm");
        }
        return current;
      });
    }, 300);

    return () => {
      clearInterval(skillCheck);
      clearInterval(damageTick);
    };
  }, [isPaused, screen, isDead, isInBossBattle, currentBossStage, showShop, showInventory, showUpgrades, showBossMenu]);
  useEffect(() => {
    const itemBonus = equippedItems.includes('item2') ? 50 : 0;
    const tt1Bonus = equippedItems.includes('tt1') ? 100 : 0;
    const bdd1Bonus = equippedItems.includes('bdd1') ? 200 : 0;
    const base = 100 + itemBonus + tt1Bonus + bdd1Bonus;
    const multiplier = timedBuffs.pp2 > 0 ? 2 : 1;
    const newMax = base * multiplier;
    
    setMaxPlayerHealth(prevMax => {
      if (newMax > prevMax) {
        setPlayerHealth(curr => Math.min(newMax, curr + (newMax - prevMax)));
      } else if (newMax < prevMax) {
        setPlayerHealth(curr => Math.min(newMax, curr));
      }
      return newMax;
    });
  }, [equippedItems, timedBuffs.pp2]);

  // Handle timed buffs countdown
  useEffect(() => {
    if (!isPaused && screen === "next") {
      const interval = setInterval(() => {
        setTimedBuffs(prev => ({
          pp1: Math.max(0, prev.pp1 - 1),
          pp2: Math.max(0, prev.pp2 - 1),
          pp3: Math.max(0, prev.pp3 - 1),
        }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused, screen]);

  // Refs for tracking processed hits to prevent double damage in Dev mode
  const processedHitsRef = useRef<Set<number>>(new Set());
  const enemyXRef = useRef(enemyX);
  const enemyActiveRef = useRef(enemyActive);
  const isInBossBattleRef = useRef(isInBossBattle);

  useEffect(() => {
    enemyXRef.current = enemyX;
  }, [enemyX]);

  useEffect(() => {
    enemyActiveRef.current = enemyActive;
  }, [enemyActive]);

  useEffect(() => {
    isInBossBattleRef.current = isInBossBattle;
  }, [isInBossBattle]);

  // New states for the "Bubu" projectile and "Haginhask" explosion
  const [projectile, setProjectile] = useState<{ x: number; y: number; active: boolean; startTime: number; elapsed?: number } | null>(null);
  const [explosion, setExplosion] = useState<{ x: number; y: number; active: boolean } | null>(null);

  // Handle cooldown countdown
  useEffect(() => {
    if (cooldown > 0 && !isPaused) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown, isPaused]);

  useEffect(() => {
    if (gibonCooldown > 0 && !isPaused) {
      const timer = setTimeout(() => setGibonCooldown((prev) => Math.max(0, prev - 100)), 100);
      return () => clearTimeout(timer);
    }
  }, [gibonCooldown, isPaused]);

  // Projectile movement (Bubu)
  useEffect(() => {
    if (projectile?.active && screen === "next" && !isDead && !isPaused) {
      const interval = setInterval(() => {
        setProjectile(prev => {
          if (!prev) return null;
          
          const speed = 80; // horizontal speed
          const frameTime = 0.016; // approximately 16ms
          const nextElapsed = (prev.elapsed || 0) + frameTime;
          const newX = 22 + speed * nextElapsed;
          
          const initialViy = 130; 
          const gravity = 400;   
          const arcHeight = (initialViy * nextElapsed) - (0.5 * gravity * nextElapsed * nextElapsed);
          const newY = 50 - arcHeight;

          if (newX > 110) {
            return null;
          } else {
            return { ...prev, x: newX, y: newY, elapsed: nextElapsed };
          }
        });
      }, 16);
      return () => clearInterval(interval);
    }
  }, [projectile?.active, screen, isDead, isPaused]);

  // Projectile movement (Gibon) - Stable interval
  useEffect(() => {
    if (screen === "next" && !isDead && !isPaused) {
      const interval = setInterval(() => {
        setGibonProjectiles(prev => {
          if (prev.length === 0) return prev;
          
          const next = prev.map(p => {
            const nextX = p.x + 3.5;
            const dx = Math.abs(nextX - enemyXRef.current);
            // Mark as hit if close enough, but don't trigger damage here
            if (dx < 6 && (enemyActiveRef.current || isInBossBattleRef.current) && !p.hit) {
              return { ...p, x: nextX, hit: true };
            }
            return { ...p, x: nextX };
          });

          return next.filter(p => p.x < 130);
        });
      }, 16);
      return () => clearInterval(interval);
    }
  }, [screen, isDead, isPaused]);

  // Separate effect to handle damage whenever a projectile's 'hit' state changes
  useEffect(() => {
    const freshHits = gibonProjectiles.filter(p => p.hit && !processedHitsRef.current.has(p.id));
    if (freshHits.length > 0) {
      freshHits.forEach(p => {
        processedHitsRef.current.add(p.id);
        handleGibonHit();
      });
    }
  }, [gibonProjectiles]);

  const isDeathProcessingRef = useRef(false);

  // Handle Level Up logic
  useEffect(() => {
    const getMaxEx = (level: number) => {
      if (level >= 10) return 10000;
      if (level >= 5) return 4000;
      return 500;
    };

    const maxEx = getMaxEx(playerLevel);
    if (playerEx >= maxEx) {
      setPlayerEx(prev => prev - maxEx);
      setPlayerLevel(prev => prev + 1);
      setShowLevelUpEffect(true);
      setPlayerHealth(maxPlayerHealth);
      setTimeout(() => setShowLevelUpEffect(false), 2000);
    }
  }, [playerEx, playerLevel, maxPlayerHealth]);

  const awardEx = (amount: number) => {
    const multiplier = timedBuffs.pp1 > 0 ? 2 : 1;
    setPlayerEx(prev => prev + (amount * multiplier));
  };

  const getChapterEx = (ch: number) => {
    if (ch >= 6) return 5000;
    if (ch >= 3) return 1000;
    return 100;
  };

  const handleEnemyDeath = () => {
    if (isDeathProcessingRef.current) return;
    isDeathProcessingRef.current = true;

    setKills(k => k + 1);
    setEnemyActive(false);

    // Drop Gems (Bosuck)
    const gemRoll = Math.random();
    if (isBoss) {
      if (gemRoll < 0.6) dropGems(10);
    } else {
      if (gemRoll < 0.2) dropGems(5);
    }

    // Drop Items (100% chance for item3 as per user request)
    dropItems('item3');
    
    // item1 and item2 with 30% drop probability
    if (Math.random() < 0.3) dropItems('item1');
    if (Math.random() < 0.3) dropItems('item2');

    if (isBoss) {
      // Boss Defeated
      let bossReward = 500;
      if (chapter >= 31) bossReward = 20000;
      else if (chapter >= 20) bossReward = 10000;
      else if (chapter >= 11) bossReward = 3000;
      else if (chapter >= 6) bossReward = 1000;
      
      dropCoins(bossReward);
      dropEx(getChapterEx(chapter));
      setShowClear(true);
      const nextChapter = chapter + 1;
      setTimeout(() => {
        setShowClear(false);
        setChapter(nextChapter);
        setKillsInChapter(0);
        setIsBoss(false);
        isDeathProcessingRef.current = false;
      }, 2000);
      
      setTimeout(() => {
        setEnemyX(115);
        // Health Scaling: Ch 1-2: 100 | Ch 3-5: 200 | Ch 6+: 400
        let nextMax;
        if (nextChapter >= 6) nextMax = 400;
        else if (nextChapter >= 3) nextMax = 200;
        else nextMax = 100;
        setMaxEnemyHealth(nextMax);
        setEnemyHealth(nextMax);
        setEnemyActive(true);
      }, 3000);
    } else {
      // Normal Enemy Defeated
      let enemyReward = 100;
      if (chapter >= 31) enemyReward = 4000;
      else if (chapter >= 20) enemyReward = 2000;
      else if (chapter >= 11) enemyReward = 500;
      else if (chapter >= 6) enemyReward = 300;

      dropCoins(enemyReward);
      setKillsInChapter(prev => {
        const nextKills = prev + 1;
        const nextIsBoss = nextKills >= 3;
        
        setTimeout(() => {
          setEnemyX(115);
          setIsBoss(nextIsBoss);
          
          // Health Scaling:
          // Ch 1-2: Enemy 100, Boss 200
          // Ch 3-5: Enemy 200, Boss 350
          // Ch 6+: Enemy 400, Boss 600
          let nextMax;
          if (chapter >= 6) {
            nextMax = nextIsBoss ? 600 : 400;
          } else if (chapter >= 3) {
            nextMax = nextIsBoss ? 350 : 200;
          } else {
            nextMax = nextIsBoss ? 200 : 100;
          }
          
          setMaxEnemyHealth(nextMax);
          setEnemyHealth(nextMax);
          setEnemyActive(true);
          isDeathProcessingRef.current = false;
        }, 3000);

        return nextKills;
      });
    }
  };

  const handleGibonHit = () => {
    if (!enemyActiveRef.current && !isInBossBattleRef.current) return;
    
    setIsEnemyHit(true);
    setTimeout(() => setIsEnemyHit(false), 100);
    
    const baseDamage = 10 + (gibonLevel * 10);
    let multiplier = 1;
    if (equippedItems.includes('item1')) multiplier += 0.05;
    if (equippedItems.includes('bb1')) multiplier += 0.10;
    if (equippedItems.includes('zbb')) multiplier *= 3;
    if (timedBuffs.pp3 > 0) multiplier *= 2;
    
    const damage = Math.floor(baseDamage * multiplier);

    if (isInBossBattle) {
      setBossHealth(prev => Math.max(0, prev - damage));
      spawnDamageEffect(enemyXRef.current, 50 + (Math.random() * 10 - 5), damage, "text-yellow-400");
    } else if (enemyActiveRef.current) {
      setEnemyHealth(prev => {
        const nextHealth = prev - damage;
        if (nextHealth <= 0) {
          handleEnemyDeath();
          return 0;
        }
        return nextHealth;
      });
      spawnDamageEffect(enemyXRef.current, 50 + (Math.random() * 10 - 5), damage, "text-white");
    }
  };

  const dropCoins = (amount = 100) => {
    const coinId = Date.now();
    setDroppedCoins(prev => [...prev, { id: coinId, x: enemyXRef.current, y: 50, flying: false }]);
    setTimeout(() => {
      setDroppedCoins(prev => prev.map(c => c.id === coinId ? { ...c, flying: true } : c));
      setTimeout(() => {
        setCoins(curr => curr + amount);
        setDroppedCoins(prev => prev.filter(c => c.id !== coinId));
      }, 800);
    }, 300);
  };

  const dropItems = (itemId: string) => {
    const dropId = Date.now() + Math.random();
    setDroppedItems(prev => [...prev, { id: dropId, x: enemyXRef.current, y: 50, itemId, flying: false }]);
    setTimeout(() => {
      setDroppedItems(prev => prev.map(i => i.id === dropId ? { ...i, flying: true } : i));
      setTimeout(() => {
        setInventory(prev => {
          if (!prev.includes(itemId)) {
            return [...prev, itemId];
          }
          return prev;
        });
        setDroppedItems(prev => prev.filter(i => i.id !== dropId));
      }, 800);
    }, 300);
  };

  const dropGems = (amount = 1) => {
    const dropId = Date.now() + Math.random();
    setDroppedGems(prev => [...prev, { id: dropId, x: enemyXRef.current, y: 50, flying: false }]);
    setTimeout(() => {
      setDroppedGems(prev => prev.map(g => g.id === dropId ? { ...g, flying: true } : g));
      setTimeout(() => {
        setGems(curr => curr + amount);
        setDroppedGems(prev => prev.filter(g => g.id !== dropId));
      }, 800);
    }, 300);
  };

  const dropEx = (amount: number) => {
    const dropId = Date.now() + Math.random();
    setDroppedEx(prev => [...prev, { id: dropId, x: enemyXRef.current, y: 50, amount, flying: false }]);
    setTimeout(() => {
      setDroppedEx(prev => prev.map(e => e.id === dropId ? { ...e, flying: true } : e));
      setTimeout(() => {
        awardEx(amount);
        setDroppedEx(prev => prev.filter(e => e.id !== dropId));
      }, 800);
    }, 300);
  };

  // Enemy movement and collision
  useEffect(() => {
    if (screen === "next" && !isDead && (enemyActive || isInBossBattle) && !isPaused) {
      const interval = setInterval(() => {
        setEnemyX((prev) => {
          // Normal enemies are slightly faster (0.1) than the Boss (0.08)
          // bboss1 (Stage 1) is slightly faster than boss1
          let speed = isBoss ? 0.08 : 0.1;
          if (isInBossBattle) {
            speed = currentBossStage === 1 ? 0.09 : 0.08;
          }
          const next = prev - speed;
          
            // Player collision detection (Player at ~22%, 50%)
          if (next > 18 && next < 26) {
            const now = Date.now();
            if (now - lastDamageTimeRef.current > 1000) { // 1 second invincibility frame
              lastDamageTimeRef.current = now;
              
              let damage = 0;
              if (isInBossBattle) {
                // Boss Battle damage logic
                // Stage 1 boss contact damage is 500 as per request
                damage = currentBossStage === 1 ? 500 : 10 + (currentBossStage * 5);
              } else {
                // Regular Chapter damage logic
                if (chapter >= 6) {
                  damage = isBoss ? 300 : 200;
                } else if (chapter >= 3) {
                  damage = isBoss ? 200 : 100;
                } else {
                  damage = isBoss ? 100 : 50;
                }
              }

              // Trigger red flash
              setPlayerIsHit(true);
              setTimeout(() => setPlayerIsHit(false), 200);

              setPlayerHealth(current => {
                const nextHealth = Math.max(0, current - damage);
                if (nextHealth <= 0) {
                  setTimeout(() => setIsDead(true), 100);
                }
                return nextHealth;
              });
              spawnDamageEffect(25, 50, damage, "text-red-500 font-black text-4xl shadow-lg");
            }
            
            // Knockback effect: push enemy back to the middle-right area (~60%)
            // Always return 60 to prevent enemy from overlapping player during invincibility
            return 60;
          }
          
          if (next < -20) return 115; // Reset off-screen right
          return next;
        });
      }, 16);
      return () => clearInterval(interval);
    }
  }, [screen, isDead, enemyActive, isInBossBattle, currentBossStage, isBoss, isPaused, chapter]);

  const handleStart = () => {
    setScreen("next");
    setIsDead(false);
    setEnemyActive(true);
    setEnemyHealth(100);
    setMaxEnemyHealth(100);
    setIsBoss(false);
    setKills(0);
    setKillsInChapter(0);
    setPlayerLevel(1);
    setPlayerEx(0);
    setChapter(1);
    setGibonLevel(0);
    setBubuLevel(0);
    setShowClear(false);
    setIsEnemyHit(false);
    setEnemyX(110);
    setProjectile(null);
    setExplosion(null);
    setGibonProjectiles([]);
    setGibonCooldown(0);
    setTimedBuffs({ pp1: 0, pp2: 0, pp3: 0 });
    const initialMaxHP = equippedItems.includes('item2') ? 150 : 100;
    setPlayerHealth(initialMaxHP);
    setMaxPlayerHealth(initialMaxHP);
    lastDamageTimeRef.current = 0;
    setIsPaused(false);
    setDroppedCoins([]);
    setDroppedItems([]);
    setDroppedGems([]);
    setDroppedEx([]);
    processedHitsRef.current.clear();
  };

  const handleRestart = () => {
    setIsDead(false);
    setEnemyActive(true);
    setEnemyHealth(100);
    setMaxEnemyHealth(100);
    setIsBoss(false);
    setKills(0);
    setKillsInChapter(0);
    setPlayerLevel(1);
    setPlayerEx(0);
    setChapter(1);
    setGibonLevel(0);
    setBubuLevel(0);
    setShowClear(false);
    setIsEnemyHit(false);
    setEnemyX(115);
    setCooldown(0);
    setGibonCooldown(0);
    setTimedBuffs({ pp1: 0, pp2: 0, pp3: 0 });
    setIsPaused(false);
    setShowGif(false);
    setProjectile(null);
    setExplosion(null);
    setGibonProjectiles([]);
    setDroppedCoins([]);
    setDroppedItems([]);
    setDroppedGems([]);
    setDroppedEx([]);
    const initialMaxHP = equippedItems.includes('item2') ? 150 : 100;
    setPlayerHealth(initialMaxHP);
    setMaxPlayerHealth(initialMaxHP);
    lastDamageTimeRef.current = 0;
    processedHitsRef.current.clear();
  };

  const handleGotoStages = () => {
    setIsInBossBattle(false);
    setIsDead(false);
    setIsPaused(false);
    setShowBossMenu(true);
    setEnemyActive(true);
    setEnemyX(115);
    setBossSkills([]);
    setGibonProjectiles([]);
    setProjectile(null);
    setExplosion(null);
  };

  const handleRetry = () => {
    setIsDead(false);
    setIsPaused(false);
    setPlayerHealth(maxPlayerHealth);
    setBossSkills([]);
    setGibonProjectiles([]);
    setProjectile(null);
    setExplosion(null);
    setEnemyX(115);
    
    if (isInBossBattle) {
      setBossHealth(maxBossHealth);
    } else {
      setEnemyHealth(maxEnemyHealth);
    }
  };

  const handleTriggerGibon = () => {
    if (gibonCooldown > 0 || isDead) return;
    setGibonCooldown(700);
    // Positioned at the player for flying projectile
    setGibonProjectiles(prev => [...prev, { id: Date.now(), x: 22, y: 50 }]);
  };

  const handleTriggerGif = () => {
    if (cooldown > 0 || isDead) return;

    setShowGif(true);
    setCooldown(20);
    
    // Launch the Bubu projectile
    setProjectile({
      x: 22,
      y: 50,
      active: true,
      startTime: Date.now(),
      elapsed: 0
    });

    setTimeout(() => {
      setShowGif(false);
    }, 2500);
  };

  const handleTriggerExplosion = () => {
    if (!projectile?.active) return;

    const explosionX = projectile.x;
    const explosionY = projectile.y;

    // Deactivate projectile
    setProjectile(null);

    // Activate explosion (haginhask.gif)
    setExplosion({
      x: explosionX,
      y: explosionY,
      active: true
    });

    // Check collision with enemy or boss
    const dx = Math.abs(explosionX - enemyX);
    
    if (dx < 10 && (enemyActive || isInBossBattle)) { 
      setIsEnemyHit(true);
      setTimeout(() => setIsEnemyHit(false), 200);

      const baseDamage = 80 + (bubuLevel * 15);
      let multiplier = 1;
      if (equippedItems.includes('item1')) multiplier += 0.05;
      if (equippedItems.includes('bb1')) multiplier += 0.10;
      if (equippedItems.includes('zbb')) multiplier *= 3;
      if (timedBuffs.pp3 > 0) multiplier *= 2;
      
      const damage = Math.floor(baseDamage * multiplier);

      if (isInBossBattle) {
        setBossHealth(prev => Math.max(0, prev - damage));
        spawnDamageEffect(enemyX, 50 + (Math.random() * 20 - 10), damage, "text-yellow-500 text-5xl");
      } else {
        setEnemyHealth(prev => {
          const newHealth = prev - damage;
          if (newHealth <= 0) {
            handleEnemyDeath();
            return 0;
          }
          // Knockback: push enemy back by 5%
          setEnemyX(curr => Math.min(115, curr + 5));
          return newHealth;
        });
        spawnDamageEffect(enemyX, 50 + (Math.random() * 20 - 10), damage, "text-white text-5xl");
      }
    }

    // Auto cleanup explosion
    setTimeout(() => {
      setExplosion(null);
    }, 1500); // Adjust according to GIF length
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPaused(prev => !prev);
        return;
      }

      if (screen === "next" && !isDead && !isPaused) {
        if (e.key.toLowerCase() === "q") {
          handleTriggerGif();
        }
        if (e.key.toLowerCase() === "g") {
          handleTriggerGibon();
        }
        if (e.key.toLowerCase() === "w" && projectile?.active) {
          handleTriggerExplosion();
        }
      }
      if (isDead && e.key === "Enter") {
        handleRetry();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, cooldown, gibonCooldown, isDead, projectile, enemyX, isPaused]); // Important to include dependencies

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-black overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-600">
      <AnimatePresence mode="wait">
        {screen === "start" ? (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Background Image with Padding */}
            <div className="absolute inset-4 sm:inset-8 z-0 overflow-hidden rounded-[2rem] shadow-2xl border-2 border-white/10">
              <img 
                src="/BAGUG.png" 
                alt="BAGUG Background" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/1920x1080/000/white?text=BAGUG.png";
                }}
              />
            </div>

            <div className="relative z-20 flex flex-col items-center w-full px-4 mt-60">
              {/* Start Button Section */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              >
                <button
                  id="start-button"
                  onClick={handleStart}
                  className="group flex items-center gap-4 bg-white text-blue-600 px-10 py-5 sm:px-12 sm:py-6 rounded-2xl font-black text-2xl sm:text-4xl shadow-xl hover:bg-blue-50 hover:translate-y-[-2px] active:translate-y-[1px] transition-all cursor-pointer border-4 border-blue-50 uppercase"
                >
                  <Play className="w-6 h-6 sm:w-10 sm:h-10 fill-current" />
                  <span className="tracking-tight">게임시작!</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="next-screen"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* UI Header Section */}
            <div className="absolute top-6 left-6 right-6 z-50 flex items-start justify-between pointer-events-none">
              {/* Left Side: Vertical Stack (Coin -> Gem -> Level Up -> Shop -> Items) */}
              <div className="flex flex-col gap-3 pointer-events-auto">
                {/* Coin UI */}
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border-2 border-white/10 shadow-xl w-fit">
                  <img src="/coin.png" alt="Coin" className="w-8 h-8 object-contain" onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/40x40/ffd700/000?text=C"} />
                  <span className="text-white font-black text-2xl font-mono tabular-nums">{coins.toLocaleString()}</span>
                </div>

                {/* Gems UI (Bosuck) */}
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border-2 border-emerald-500/30 shadow-xl w-fit">
                  <img src="/bosuck.png" alt="Gem" className="w-8 h-8 object-contain" onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/40x40/10b981/fff?text=B"} />
                  <span className="text-emerald-300 font-black text-2xl font-mono tabular-nums">{gems.toLocaleString()}</span>
                </div>

                {/* Level Up Button */}
                <button 
                  onClick={() => {
                    setShowUpgrades(!showUpgrades);
                    setShowInventory(false);
                    setShowShop(false);
                  }}
                  className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-4 transition-all duration-100 shadow-lg active:scale-95 ${showUpgrades ? 'bg-white border-blue-500 text-blue-600' : 'bg-white border-white/50 text-black/80 shadow-[0_0_20px_rgba(255,255,255,0.2)]'}`}
                >
                  <span className="text-xs font-black leading-tight">레벨</span>
                  <span className="text-xs font-black leading-tight">업</span>
                </button>

                {/* Shop Button */}
                <button 
                  onClick={() => {
                    setShowShop(!showShop);
                    setShowInventory(false);
                    setShowUpgrades(false);
                  }}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center border-4 transition-all duration-100 shadow-lg active:scale-95 ${showShop ? 'bg-white border-blue-500 text-blue-600' : 'bg-white border-white/50 text-black/80 shadow-[0_0_20px_rgba(255,255,255,0.2)]'}`}
                >
                  <img 
                    src="/shop.png" 
                    alt="Shop" 
                    className="w-10 h-10 object-contain" 
                    onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/40x40/fff/000?text=ITEM"}
                  />
                </button>

                {/* Items/Inventory Button */}
                <button 
                  onClick={() => {
                    setShowInventory(!showInventory);
                    setShowUpgrades(false);
                    setShowShop(false);
                    setShowBossMenu(false);
                  }}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center border-4 transition-all duration-100 shadow-lg active:scale-95 ${showInventory ? 'bg-white border-blue-500 text-blue-600' : 'bg-white border-white/50 text-black/80 shadow-[0_0_20px_rgba(255,255,255,0.2)]'}`}
                >
                  <img 
                    src="/item.png" 
                    alt="Items" 
                    className="w-10 h-10 object-contain" 
                    onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/40x40/fff/000?text=ITEM"}
                  />
                </button>


              </div>

              {/* Right Side: EX and Chapter Horizontal Stack */}
              <div className="flex items-center gap-4 pointer-events-auto">
                {/* Level and EX Display */}
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg flex flex-col gap-1 min-w-[160px]">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 font-mono text-[10px] uppercase tracking-widest font-bold">LV.{playerLevel}</span>
                    <div className="flex items-center gap-1">
                      <img src="/ex.png" alt="" className="w-5 h-5 object-contain" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                    </div>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(playerEx / (playerLevel >= 10 ? 10000 : playerLevel >= 5 ? 4000 : 500)) * 100}%` 
                      }}
                      transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <span className="text-white/40 font-mono text-[8px] font-bold">
                      {playerEx.toLocaleString()} / {(playerLevel >= 10 ? 10000 : playerLevel >= 5 ? 4000 : 500).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Chapter Display */}
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] w-fit flex flex-col items-center">
                    <span className="text-blue-400 font-mono text-xs uppercase tracking-[0.2em] font-bold mb-1">Chapter</span>
                    <span className="text-white font-black text-3xl italic leading-none">{chapter}</span>
                  </div>

                  {/* Achievement Button */}
                  <button 
                    onClick={() => setShowAchievements(true)}
                    className="flex flex-col items-center group active:scale-95 transition-transform"
                  >
                    <div className="bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-300 shadow-lg rounded-xl p-2 group-hover:shadow-amber-500/20 transition-all">
                      <Trophy size={20} className="text-white drop-shadow-sm" />
                    </div>
                    <span className="text-[10px] font-black text-amber-200 mt-1 uppercase tracking-widest drop-shadow-md font-mono">업적</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Top Center: Boss Battle Entry (bi) */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="relative group pointer-events-auto">
                <button 
                  disabled={playerLevel < 20}
                  onClick={() => {
                    setShowBossMenu(!showBossMenu);
                    setShowInventory(false);
                    setShowUpgrades(false);
                    setShowShop(false);
                  }}
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center border-4 transition-all duration-100 shadow-2xl active:scale-95 ${
                    playerLevel < 20 ? 'opacity-50 grayscale cursor-not-allowed bg-gray-800 border-gray-600' : 
                    showBossMenu ? 'bg-white border-red-500 text-red-600 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 
                    'bg-white border-white/50 text-black/80 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:border-red-400'
                  }`}
                >
                  <img 
                    src="/bi.png" 
                    alt="Boss" 
                    className="w-14 h-14 object-contain" 
                    onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/60x60/f00/fff?text=BOSS"}
                  />
                </button>
                {playerLevel < 20 && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/80 text-white px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
                    LV.20 잠금 해제
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Right Hud Section (Buffs Only) */}
            <div className="absolute right-6 bottom-6 flex flex-col items-end gap-3 pointer-events-none z-50">
              {timedBuffs.pp1 > 0 && (
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-blue-500/50 flex items-center gap-3 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <img src="/pp1.png" alt="Buff 1" className="w-8 h-8 object-contain" onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/32x32/3b82f6/fff?text=X2"} />
                  <span className="text-white font-mono text-sm font-black italic">{Math.floor(timedBuffs.pp1 / 60)}:{(timedBuffs.pp1 % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
              {timedBuffs.pp2 > 0 && (
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-emerald-500/50 flex items-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <img src="/pp2.png" alt="Buff 2" className="w-8 h-8 object-contain" onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/32x32/10b981/fff?text=HP"} />
                  <span className="text-white font-mono text-sm font-black italic">{Math.floor(timedBuffs.pp2 / 60)}:{(timedBuffs.pp2 % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
              {timedBuffs.pp3 > 0 && (
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-red-500/50 flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <img src="/pp3.png" alt="Buff 3" className="w-8 h-8 object-contain" onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/32x32/ef4444/fff?text=ATK"} />
                  <span className="text-white font-mono text-sm font-black italic">{Math.floor(timedBuffs.pp3 / 60)}:{(timedBuffs.pp3 % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>

            {/* Achievement Modal */}
            <AnimatePresence>
              {showAchievements && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-xl p-6"
                  onClick={() => setShowAchievements(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 30 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-xl bg-gray-950 border-4 border-amber-500/50 rounded-[3rem] p-8 shadow-[0_0_120px_rgba(245,158,11,0.2)] flex flex-col gap-8"
                  >
                    <div className="flex items-center justify-between border-b-2 border-amber-500/20 pb-6">
                      <div className="flex items-center gap-4">
                        <Trophy className="text-amber-400" size={40} />
                        <h2 className="text-white text-5xl font-black italic tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">업적</h2>
                      </div>
                      <button 
                        onClick={() => setShowAchievements(false)}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 w-12 h-12 rounded-full flex items-center justify-center transition-all border border-amber-500/20"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-4 overflow-y-auto pr-2 max-h-[50vh] scrollbar-hide">
                      {achievements.map((ach) => {
                        const isClaimed = claimedAchievements.includes(ach.id);
                        const canClaim = ach.condition(playerLevel) && !isClaimed;
                        
                        return (
                          <div 
                            key={ach.id}
                            className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${
                              isClaimed 
                                ? 'bg-gray-800/40 border-gray-700 opacity-60' 
                                : 'bg-gray-900 border-amber-500/20'
                            }`}
                          >
                            <div className="flex flex-col gap-1">
                              <h3 className="text-amber-200 font-bold text-xl">{ach.title}</h3>
                              <p className="text-gray-400 text-sm font-medium">{ach.description}</p>
                              <div className="mt-2 inline-flex items-center px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">보상: {ach.reward.label}</span>
                              </div>
                            </div>
                            
                            <button
                              disabled={!canClaim && !isClaimed}
                              onClick={() => claimAchievement(ach.id)}
                              className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${
                                isClaimed
                                  ? 'bg-gray-700 text-gray-500 cursor-default'
                                  : canClaim
                                    ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20 hover:scale-105'
                                    : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                              }`}
                            >
                              {isClaimed ? '완료됨' : '보상 받기'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Boss Stage Selection Menu */}
            <AnimatePresence>
              {showBossMenu && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
                  onClick={() => setShowBossMenu(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-4xl bg-gray-900 border-4 border-red-500/50 rounded-[3rem] p-8 shadow-[0_0_100px_rgba(239,68,68,0.3)] flex flex-col gap-8"
                  >
                    <div className="flex items-center justify-between border-b-2 border-red-500/20 pb-6">
                      <div className="flex items-center gap-4">
                        <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400 text-5xl font-black italic tracking-tighter uppercase">BOSS BATTLE</h2>
                        <div className="bg-red-500/20 px-4 py-1 rounded-full border border-red-500/30">
                          <span className="text-red-400 font-black text-xs">20 단계</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowBossMenu(false)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 w-12 h-12 rounded-full flex items-center justify-center transition-all border border-red-500/20"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto pr-4 scrollbar-hide py-2 max-h-[60vh]">
                      {Array.from({ length: 20 }).map((_, i) => {
                        const stage = i + 1;
                        let requiredLv = 20;

                        if (stage <= 3) requiredLv = 20;
                        else if (stage <= 8) requiredLv = 30;
                        else if (stage <= 15) requiredLv = 50;
                        else requiredLv = 100;

                        // Phase 2~20 are Coming Soon
                        const isComingSoon = stage > 1;
                        const isLocked = playerLevel < requiredLv || isComingSoon;
                        const isCompleted = completedBossStages.includes(stage);

                        return (
                          <button
                            key={stage}
                            disabled={isLocked}
                            onClick={() => {
                              setCurrentBossStage(stage);
                              setIsInBossBattle(true);
                              setEnemyActive(false); // Hide normal chapter enemies
                              setEnemyX(115); // Start boss from right
                              // Phase 1 has 10,000 HP
                              const hp = stage === 1 ? 10000 : stage * 5000;
                              setMaxBossHealth(hp);
                              setBossHealth(hp);
                              setShowBossMenu(false);
                            }}
                            className={`relative group h-32 rounded-3xl border-4 transition-all flex flex-col items-center justify-center gap-2 ${
                              isLocked 
                                ? 'bg-black/40 border-white/5 opacity-50 grayscale cursor-not-allowed' 
                                : isCompleted 
                                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                  : 'bg-red-500/10 border-red-500/50 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:scale-105 active:scale-95'
                            }`}
                          >
                            <span className={`text-4xl font-black italic ${isLocked ? 'text-white/20' : 'text-white'}`}>#{stage}</span>
                            <div className="flex flex-col items-center">
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${isLocked ? 'text-red-500' : 'text-white/40'}`}>
                                {isComingSoon ? 'Coming Soon' : isLocked ? `LV.${requiredLv}+` : isCompleted ? 'CLEARED' : `${stage} 단계`}
                              </span>
                            </div>
                            {isLocked && !isComingSoon && <Lock size={16} className="absolute top-4 right-4 text-red-500/50" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Central Shop Modal */}
            <AnimatePresence>
              {showShop && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
                  onClick={() => setShowShop(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl bg-gray-900 border-4 border-white/20 rounded-[3rem] p-8 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col gap-8"
                  >
                    <div className="flex items-center justify-between border-b-2 border-white/10 pb-6">
                      <div className="flex items-center gap-4">
                        <h2 className="text-white text-5xl font-black italic tracking-tighter uppercase">상점</h2>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-xl border border-emerald-500/30">
                            <img src="/bosuck.png" alt="Gem" className="w-6 h-6 object-contain" />
                            <span className="text-emerald-400 font-mono text-xl font-black">{gems}</span>
                          </div>

                        </div>
                      </div>
                      <button 
                        onClick={() => setShowShop(false)}
                        className="bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                      {[
                        { id: 'bb1', name: '하진이가 아끼는 반지', desc: '공격력 10% 증가', price: 30, type: 'permanent' },
                        { id: 'tt1', name: '세련된 모자', desc: '최대 체력 +100', price: 30, type: 'permanent' },
                        { id: 'tt2', name: '세련된 옷', desc: '1초마다 20hp 회복', price: 30, type: 'permanent' },
                        { id: 'pp1', name: '경험치 물약', desc: '10분 동안 경험치 2배', price: 35, type: 'timed' },
                        { id: 'pp2', name: '채력 물약', desc: '10분 동안 체력 2배', price: 35, type: 'timed' },
                        { id: 'pp3', name: '공격증가 물약', desc: '10분 동안 공격력 2배', price: 35, type: 'timed' },
                      ].map((item) => {
                        const isOwned = inventory.includes(item.id);
                        return (
                          <button 
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.type === 'permanent' && isOwned) return;
                              if (gems >= item.price) {
                                setGems(g => g - item.price);
                                if (item.type === 'permanent') {
                                  setInventory(prev => {
                                    if (!prev.includes(item.id)) return [...prev, item.id];
                                    return prev;
                                  });
                                } else {
                                  setPotionInventory(prev => {
                                    const existing = prev.find(p => p.id === item.id);
                                    if (existing) {
                                      return prev.map(p => p.id === item.id ? { ...p, count: p.count + 1 } : p);
                                    }
                                    return [...prev, { id: item.id, count: 1 }];
                                  });
                                }
                              }
                            }}
                            disabled={gems < item.price || (item.type === 'permanent' && isOwned)}
                            className={`group relative flex flex-col items-center gap-3 p-4 rounded-3xl border-4 transition-all active:scale-95 ${
                              gems < item.price || (item.type === 'permanent' && isOwned)
                                ? 'opacity-40 grayscale cursor-not-allowed bg-white/5 border-white/5' 
                                : 'bg-blue-600/10 border-blue-500/50 hover:bg-blue-600/20 hover:border-blue-500'
                            }`}
                          >
                            <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center border-2 border-white/10 p-2">
                              <img src={`/${item.id}.png`} alt={item.name} className="w-full h-full object-contain" onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/80x80/333/fff?text=" + item.id} />
                            </div>
                            <div className="text-center">
                              <p className="text-white font-black text-lg leading-tight uppercase">{item.name}</p>
                              <p className="text-white/40 text-[10px] font-bold mt-1 uppercase leading-tight">{item.desc}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2 bg-black/40 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                              <img src="/bosuck.png" alt="Gem" className="w-4 h-4 object-contain" />
                              <span className="text-emerald-400 font-mono text-sm font-black">{item.id === 'permanent' && isOwned ? 'OWNED' : item.price}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border-2 border-white/10">
                      <p className="text-white/40 text-xs font-mono uppercase tracking-[0.2em] text-center">
                        Coming Soon
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Central Upgrades Modal */}
            <AnimatePresence>
              {showUpgrades && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
                  onClick={() => setShowUpgrades(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl bg-gray-900 border-4 border-white/20 rounded-[3rem] p-8 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col gap-8"
                  >
                    <div className="flex items-center justify-between border-b-2 border-white/10 pb-6">
                      <h2 className="text-white text-5xl font-black italic tracking-tighter uppercase">LEVEL UP</h2>
                      <button 
                        onClick={() => setShowUpgrades(false)}
                        className="bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const cost = Math.floor(100 * Math.pow(1.5, gibonLevel));
                          if (coins >= cost) {
                            setCoins(c => c - cost);
                            setGibonLevel(l => l + 1);
                          }
                        }}
                        disabled={coins < Math.floor(100 * Math.pow(1.5, gibonLevel))}
                        className={`group relative flex items-center gap-6 p-6 rounded-[2rem] border-4 transition-all active:scale-95 ${
                          coins < Math.floor(100 * Math.pow(1.5, gibonLevel)) 
                            ? 'opacity-40 grayscale cursor-not-allowed bg-white/5 border-white/5' 
                            : 'bg-emerald-600/20 border-emerald-500/50 hover:bg-emerald-600/30 hover:border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                        }`}
                      >
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-2xl flex items-center justify-center border-2 border-emerald-500/30 text-emerald-400">
                          <img src="/public/gibon.png" alt="Gibon" className="w-16 h-16 object-contain drop-shadow-lg" onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/64x64/0f0/000?text=ATK"} />
                        </div>
                        <div className="flex flex-col items-start flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-white font-black text-2xl tracking-tight">기본 공격 강화</span>
                            <span className="text-emerald-400 font-mono text-sm font-black uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded">LV.{gibonLevel}</span>
                          </div>
                          <p className="text-white/40 text-sm font-bold mt-1">공격 속도와 탄환 위력을 강화합니다</p>
                          <div className="flex items-center gap-2 mt-4 bg-black/40 px-4 py-2 rounded-xl border border-white/10 group-hover:border-emerald-500/50 transition-colors">
                            <img src="/coin.png" alt="Coin" className="w-5 h-5 object-contain" />
                            <span className="text-emerald-200 font-mono text-lg font-black tracking-tight">{Math.floor(100 * Math.pow(1.5, gibonLevel))}</span>
                          </div>
                        </div>
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const cost = Math.floor(200 * Math.pow(1.5, bubuLevel));
                          if (coins >= cost) {
                            setCoins(c => c - cost);
                            setBubuLevel(l => l + 1);
                          }
                        }}
                        disabled={coins < Math.floor(200 * Math.pow(1.5, bubuLevel))}
                        className={`group relative flex items-center gap-6 p-6 rounded-[2rem] border-4 transition-all active:scale-95 ${
                          coins < Math.floor(200 * Math.pow(1.5, bubuLevel)) 
                            ? 'opacity-40 grayscale cursor-not-allowed bg-white/5 border-white/5' 
                            : 'bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30 hover:border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.1)]'
                        }`}
                      >
                        <div className="w-24 h-24 bg-purple-500/20 rounded-2xl flex items-center justify-center border-2 border-purple-500/30 text-purple-400">
                           <img src="/public/bubu.png" alt="Bubu" className="w-16 h-16 object-contain drop-shadow-lg" onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/64x64/a0f/fff?text=ULT"} />
                        </div>
                        <div className="flex flex-col items-start flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-white font-black text-2xl tracking-tight">궁극기 공격 강화</span>
                            <span className="text-purple-400 font-mono text-sm font-black uppercase tracking-widest bg-purple-400/10 px-2 py-0.5 rounded">LV.{bubuLevel}</span>
                          </div>
                          <p className="text-white/40 text-sm font-bold mt-1">강력한 범위 폭발 데미지를 강화합니다</p>
                          <div className="flex items-center gap-2 mt-4 bg-black/40 px-4 py-2 rounded-xl border border-white/10 group-hover:border-purple-500/50 transition-colors">
                            <img src="/coin.png" alt="Coin" className="w-5 h-5 object-contain" />
                            <span className="text-purple-200 font-mono text-lg font-black tracking-tight">{Math.floor(200 * Math.pow(1.5, bubuLevel))}</span>
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border-2 border-white/10">
                      <p className="text-white/60 text-xs font-mono uppercase tracking-[0.2em] text-center">
                        코인을 소모하여 능력을 업그레이드 하세요
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Central Inventory Modal */}
            <AnimatePresence>
              {showInventory && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
                  onClick={() => setShowInventory(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl bg-gray-900 border-4 border-white/20 rounded-[3rem] p-8 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col gap-8"
                  >
                    <div className="flex items-center justify-between border-b-2 border-white/10 pb-6">
                      <div className="flex flex-col gap-2">
                        <h2 className="text-white text-5xl font-black italic tracking-tighter uppercase">INVENTORY</h2>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setInventoryTab("accessory")}
                            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${inventoryTab === 'accessory' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                          >
                            장신구
                          </button>
                          <button 
                            onClick={() => setInventoryTab("potion")}
                            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${inventoryTab === 'potion' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                          >
                            포션
                          </button>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowInventory(false)}
                        className="bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                      {inventoryTab === "accessory" ? (
                        inventory.length === 0 ? (
                          <div className="col-span-2 flex items-center justify-center text-white/20 text-xl font-bold uppercase tracking-[0.2em] italic py-20">
                            장신구가 없습니다
                          </div>
                        ) : (
                          inventory.map(itemId => {
                            const isEquipped = equippedItems.includes(itemId);
                            return (
                              <button
                                key={itemId}
                                onClick={() => {
                                  if (isEquipped) {
                                    setEquippedItems(prev => prev.filter(id => id !== itemId));
                                  } else {
                                    // Handle mutual exclusivity
                                    setEquippedItems(prev => {
                                      let newEquipped = [...prev];
                                      const groups = [
                                        ['item3', 'tt2', 'bdd2'], // Regen
                                        ['item1', 'bb1', 'zbb'],  // Atk
                                        ['item2', 'tt1', 'bdd1']  // HP
                                      ];
                                      
                                      groups.forEach(group => {
                                        if (group.includes(itemId)) {
                                          newEquipped = newEquipped.filter(id => !group.includes(id));
                                        }
                                      });
                                      
                                      return [...newEquipped, itemId];
                                    });
                                  }
                                }}
                                className={`group relative flex items-center gap-6 p-6 rounded-[2rem] border-4 transition-all active:scale-95 ${
                                  isEquipped 
                                    ? 'bg-blue-600/30 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                }`}
                              >
                                <div className="w-24 h-24 bg-black/40 rounded-2xl flex items-center justify-center border-2 border-white/10 p-4">
                                  <img 
                                    src={`/${itemId}.png`} 
                                    alt={itemId} 
                                    className="w-full h-full object-contain drop-shadow-lg"
                                    onError={(e) => (e.target as HTMLImageElement).src = `https://placehold.co/128x128/333/fff?text=${itemId}`}
                                  />
                                </div>
                                <div className="flex flex-col items-start gap-1 text-left">
                                  <span className="text-white font-black text-xl tracking-tight leading-none">
                                    {itemId === 'item1' ? '하진이 결혼반지' : 
                                     itemId === 'item2' ? '그지모자' : 
                                     itemId === 'item3' ? '그지 옷' : 
                                     itemId === 'bb1' ? '하진이가 아끼는 반지' : 
                                     itemId === 'tt1' ? '세련된 모자' : 
                                     itemId === 'tt2' ? '세련된 옷' : 
                                     itemId === 'bdd1' ? 'bdd1' :
                                     itemId === 'bdd2' ? 'bdd2' :
                                     itemId === 'zbb' ? '전설의 반지 zbb' :
                                     itemId}
                                  </span>
                                  <span className={`text-xs font-bold uppercase tracking-widest mt-1 ${isEquipped ? 'text-blue-400' : 'text-white/40'}`}>
                                    {itemId === 'item1' ? '전체 공격력 +5%' : 
                                     itemId === 'item2' ? '최대 체력 +50' : 
                                     itemId === 'item3' ? '초당 체력 +10 회복' :
                                     itemId === 'bb1' ? '공격력 +10%' : 
                                     itemId === 'tt1' ? '최대 체력 +100' : 
                                     itemId === 'tt2' ? '초당 체력 +20 회복' :
                                     itemId === 'bdd1' ? '최대 체력 +200' :
                                     itemId === 'bdd2' ? '초당 체력 +40 회복' :
                                     itemId === 'zbb' ? '공격력 x3 배' :
                                     '장신구'}
                                  </span>
                                  <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${isEquipped ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'}`}>
                                    {isEquipped ? 'EQUIPPED' : 'TAP TO EQUIP'}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )
                      ) : (
                        potionInventory.length === 0 ? (
                          <div className="col-span-2 flex items-center justify-center text-white/20 text-xl font-bold uppercase tracking-[0.2em] italic py-20">
                            포션이 없습니다
                          </div>
                        ) : (
                          potionInventory.map(potion => {
                            const name = potion.id === 'pp1' ? '경험치 물약' : potion.id === 'pp2' ? '채력 물약' : '공격증가 물약';
                            const desc = potion.id === 'pp1' ? 'EXP X2 (10분)' : potion.id === 'pp2' ? 'HP X2 (10분)' : 'ATK X2 (10분)';
                            const isBuffActive = timedBuffs[potion.id as keyof typeof timedBuffs] > 0;
                            
                            return (
                              <button
                                key={potion.id}
                                disabled={potion.count <= 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTimedBuffs(prev => ({
                                    ...prev,
                                    [potion.id]: (prev[potion.id as keyof typeof prev] || 0) + 600
                                  }));
                                  setPotionInventory(prev => prev.map(p => p.id === potion.id ? { ...p, count: p.count - 1 } : p).filter(p => p.count > 0));
                                }}
                                className={`group relative flex items-center gap-6 p-6 rounded-[2rem] border-4 transition-all active:scale-95 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20`}
                              >
                                <div className="w-24 h-24 bg-black/40 rounded-2xl flex items-center justify-center border-2 border-white/10 p-4">
                                  <img 
                                    src={`/${potion.id}.png`} 
                                    alt={potion.id} 
                                    className="w-full h-full object-contain drop-shadow-lg"
                                    onError={(e) => (e.target as HTMLImageElement).src = `https://placehold.co/128x128/333/fff?text=${potion.id}`}
                                  />
                                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black border-2 border-white sm:text-lg">
                                    {potion.count}
                                  </div>
                                </div>
                                <div className="flex flex-col items-start gap-1 text-left">
                                  <span className="text-white font-black text-xl tracking-tight leading-none">{name}</span>
                                  <span className="text-xs font-bold uppercase tracking-widest mt-1 text-white/40">{desc}</span>
                                  <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${isBuffActive ? 'bg-amber-500 text-white animate-pulse' : 'bg-blue-500 text-white'}`}>
                                    {isBuffActive ? 'BUFF ACTIVE' : 'TAP TO USE'}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )
                      )}
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border-2 border-white/10">
                      <p className="text-white/60 text-xs font-mono uppercase tracking-[0.2em] text-center">
                        아이템을 선택하여 장착하거나 해제할 수 있습니다
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Flying Items */}
            <AnimatePresence>
              {droppedItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ left: `${item.x}%`, top: `${item.y}%`, scale: 0.5, opacity: 0 }}
                  animate={item.flying ? { 
                    left: "24px", 
                    top: "220px", 
                    scale: 0.8, 
                    opacity: 1 
                  } : { 
                    top: `${item.y + 10}%`, // Bounce drop
                    scale: 1.5, 
                    opacity: 1 
                  }}
                  transition={{ 
                    duration: item.flying ? 0.8 : 0.4, 
                    ease: item.flying ? "anticipate" : "easeOut" 
                  }}
                  className="absolute z-[100] w-12 h-12 pointer-events-none"
                  style={{ transform: 'translate(-50%, -50%)' }}
                >
                  <img 
                    src={`/${item.itemId}.png`} 
                    alt="Dropped Item" 
                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" 
                    onError={(e) => (e.target as HTMLImageElement).src = `https://placehold.co/48x48/fff/000?text=${item.itemId}`}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Flying Gems */}
            <AnimatePresence>
              {droppedGems.map((gem) => (
                <motion.div
                  key={gem.id}
                  initial={{ left: `${gem.x}%`, top: `${gem.y}%`, scale: 0.5, opacity: 0 }}
                  animate={gem.flying ? { 
                    left: "220px", // Adjusted to match side-by-side gem counter
                    top: "40px", 
                    scale: 1, 
                    opacity: 1 
                  } : { 
                    top: `${gem.y + 10}%`, // Bounce drop
                    scale: 1.5, 
                    opacity: 1 
                  }}
                  transition={{ 
                    duration: gem.flying ? 0.8 : 0.4, 
                    ease: gem.flying ? "anticipate" : "easeOut" 
                  }}
                  className="absolute z-[100] w-10 h-10 pointer-events-none"
                  style={{ transform: 'translate(-50%, -50%)' }}
                >
                  <img 
                    src="/bosuck.png" 
                    alt="Gem" 
                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" 
                    onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/40x40/0ff/000?text=G"}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Flying EX Tokens */}
            <AnimatePresence>
              {droppedEx.map((ex) => (
                <motion.div
                  key={ex.id}
                  initial={{ left: `${ex.x}%`, top: `${ex.y}%`, scale: 0.5, opacity: 0 }}
                  animate={ex.flying ? { 
                    left: "calc(100% - 280px)", // Target EX Bar area adjusted for new layout
                    top: "40px", 
                    scale: 0.8, 
                    opacity: 0 
                  } : { 
                    top: `${ex.y + 10}%`, // Bounce drop
                    scale: 3.0, 
                    opacity: 1 
                  }}
                  transition={{ 
                    duration: ex.flying ? 0.8 : 0.4, 
                    ease: ex.flying ? "anticipate" : "easeOut" 
                  }}
                  className="absolute z-[100] w-20 h-20 pointer-events-none"
                  style={{ transform: 'translate(-50%, -50%)' }}
                >
                  <img 
                    src="/ex.png" 
                    alt="EX" 
                    className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(59,130,246,0.8)]" 
                    onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/80x80/3b82f6/fff?text=EX"}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Flying Coins */}
            <AnimatePresence>
              {droppedCoins.map((coin) => (
                <motion.div
                  key={coin.id}
                  initial={{ left: `${coin.x}%`, top: `${coin.y}%`, scale: 0.5, opacity: 0 }}
                  animate={coin.flying ? { 
                    left: "40px", 
                    top: "40px", 
                    scale: 1, 
                    opacity: 1 
                  } : { 
                    top: `${coin.y + 10}%`, // Bounce drop
                    scale: 1.5, 
                    opacity: 1 
                  }}
                  transition={{ 
                    duration: coin.flying ? 0.8 : 0.4, 
                    ease: coin.flying ? "anticipate" : "easeOut" 
                  }}
                  className="absolute z-[60] pointer-events-none"
                  style={{ transform: 'translate(-50%, -50%)' }}
                >
                  <img src="/coin.png" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                </motion.div>
              ))}
            </AnimatePresence>
            {/* New Background Image */}
            <div className={`absolute inset-0 transition-all duration-700 ${isDead ? 'opacity-30 grayscale blur-sm' : 'opacity-100'} z-0`}>
              <img 
                src="/DDD.png" 
                alt="Next Background" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/1920x1080/444/white?text=DDD.png";
                }}
              />
              <div className={`absolute inset-0 bg-gradient-to-b ${isInBossBattle ? 'from-red-950/40 via-transparent to-red-950/60' : 'from-black/40 via-transparent to-black/60'}`} />
              
              {/* BETA Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-white text-[120px] font-black italic tracking-[0.5em] uppercase">BETA</span>
              </div>
            </div>

            {/* Enemy/Boss - good.gif, boss1.png, or bi.png (Special Boss) */}
            {!isDead && (isInBossBattle || enemyActive) && (
              <div 
                className="absolute z-10"
                style={{
                  left: `${enemyX}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isInBossBattle ? '450px' : isBoss ? '300px' : '180px',
                  height: 'auto',
                  opacity: (isInBossBattle && currentBossStage === 1 && bossSkills.length > 0) ? 0 : 1
                }}
              >
                {/* Enemy/Boss/Special Boss Label */}
                {(isBoss || isInBossBattle) && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-white font-black text-lg bg-black/40 px-4 py-1.5 rounded-lg backdrop-blur-sm border border-white/10 uppercase tracking-[0.3em] text-red-500 animate-pulse scale-110 shadow-[0_0_25px_rgba(239,68,68,0.6)] whitespace-nowrap">
                    {isInBossBattle ? `🔥 STAGE ${currentBossStage} BOSS 🔥` : '🔥 ELITE BOSS 🔥'}
                  </div>
                )}

                {/* Enemy Health Bar */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full max-w-[200px] h-3 bg-black/50 border-2 border-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className={`h-full transition-all duration-300 ${isInBossBattle || isBoss ? 'bg-gradient-to-r from-red-600 via-orange-500 to-red-400' : 'bg-red-500'}`} 
                    style={{ width: `${((isInBossBattle ? bossHealth : enemyHealth) / (isInBossBattle ? maxBossHealth : maxEnemyHealth)) * 100}%` }}
                  />
                </div>
                
                <motion.img 
                  animate={isInBossBattle ? {
                    scale: [1, 1.02, 1],
                    y: [0, -10, 0]
                  } : {}}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  src={isInBossBattle ? (currentBossStage === 1 ? "/bboss1.png" : "/bi.png") : isBoss ? "/boss1.png" : "/good.gif"} 
                  alt={isInBossBattle || isBoss ? "Boss" : "Enemy"} 
                  className={`w-full h-auto transition-all duration-75 ${isEnemyHit ? 'brightness-150 sepia(100%) saturate(10000%) hue-rotate(-50deg)' : ''}`}
                  style={isEnemyHit ? { filter: 'drop-shadow(0 0 30px red) brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(30)' } : {}}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = isInBossBattle ? "https://placehold.co/400x400/900/fff?text=BOSS" : (isBoss ? "https://placehold.co/200x200/500/fff?text=Boss" : "https://placehold.co/100x100/f00/fff?text=Enemy");
                  }}
                />
              </div>
            )}

            {/* Bubu Projectile */}
            {projectile?.active && (
              <div 
                className="absolute z-20 pointer-events-none"
                style={{
                  left: `${projectile.x}%`,
                  top: `${projectile.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '100px',
                  height: 'auto'
                }}
              >
                <img 
                  src="/bubu.png" 
                  alt="Projectile" 
                  className="w-full h-auto opacity-100"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/50x50/ff0/000?text=Bubu";
                  }}
                />
              </div>
            )}

            {/* Haginhask Explosion Effect */}
            {explosion?.active && (
              <div 
                className="absolute z-40 pointer-events-none"
                style={{
                  left: `${explosion.x}%`,
                  top: `${explosion.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '200px',
                  height: 'auto'
                }}
              >
                <img 
                  src="/haginhask.gif" 
                  alt="Explosion" 
                  className="w-full h-auto scale-150"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/150x150/f0f/fff?text=Bang";
                  }}
                />
              </div>
            )}

            {/* Gibon Projectiles (Static Strike) */}
            {gibonProjectiles.map(p => (
              <div 
                key={p.id}
                className="absolute z-30 pointer-events-none"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '140px', // Larger than Bubu (100px)
                  height: 'auto'
                }}
              >
                <img 
                  src="/gibon.png" 
                  alt="Basic Attack" 
                  className="w-full h-auto drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                  onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/80x80/fff/000?text=G"}
                />
              </div>
            ))}

            {/* Damage Numbers Overlay */}
            <AnimatePresence>
              {damageEffects.map((effect) => (
                <motion.div
                  key={effect.id}
                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: 1, y: -80, scale: 1.2 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`absolute z-[80] pointer-events-none font-black italic text-3xl sm:text-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter brightness-125 ${effect.color}`}
                  style={{
                    left: `${effect.x}%`,
                    top: `${effect.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {effect.value.toLocaleString()}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Boss Skill Stage 1 VFX Overlay - Separated for guaranteed DOM order (bbskill1 on top) */}
            <AnimatePresence>
              {bossSkills.filter(skill => skill.type === 'primary').map(skill => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${skill.x}%`,
                    top: '50%',
                    width: '450px', 
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000, 
                    mixBlendMode: 'screen',
                    backgroundColor: 'transparent'
                  }}
                >
                  <video 
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-auto object-contain"
                    style={{ 
                      filter: 'contrast(120%) brightness(110%)', // Help crush non-pure blacks
                    }}
                  >
                    <source src="/bbosskkill1.mp4" type="video/mp4" />
                  </video>
                </motion.div>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {bossSkills.filter(skill => skill.type === 'secondary').map(skill => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${skill.x}%`,
                    top: '50%',
                    width: '1500px', 
                    transform: 'translate(-50%, -50%)',
                    zIndex: 5000, 
                    mixBlendMode: 'screen',
                    backgroundColor: 'transparent'
                  }}
                >
                  <video 
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-auto object-contain"
                    style={{ 
                      filter: 'contrast(140%) brightness(100%) saturate(250%)', 
                    }}
                  >
                    <source src="/bbskill1.mp4" type="video/mp4" />
                  </video>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Static Player - Reverted to 50% top, covering "20" */}
            <div className={`absolute inset-0 pointer-events-none z-10 transition-opacity duration-300 ${isDead ? 'opacity-20 grayscale' : 'opacity-100'}`}>
              <div
                className="absolute"
                style={{
                  left: '22%', 
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '250px',
                  height: 'auto',
                }}
              >
                {/* Health bar above player */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-40 flex flex-col items-center gap-1 z-[60]">
                  <div className="w-full h-3 bg-black/60 backdrop-blur-md rounded-full border-2 border-white/20 shadow-2xl overflow-hidden p-0.5">
                    <motion.div 
                      initial={{ width: "100%" }}
                      animate={{ width: `${(playerHealth / maxPlayerHealth) * 100}%` }}
                      className={`h-full rounded-full transition-colors duration-500 ${
                        (playerHealth / maxPlayerHealth) > 0.5 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 
                        (playerHealth / maxPlayerHealth) > 0.2 ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]' : 
                        'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse'
                      }`}
                    />
                  </div>
                  <span className="text-white text-xs font-black font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{playerHealth} / {maxPlayerHealth}</span>
                </div>

                {/* Item 3 Visual Marker in middle of player */}
                {(equippedItems.includes('item3') || equippedItems.includes('tt2') || equippedItems.includes('bdd2')) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-[38%] left-[49%] -translate-x-1/2 -translate-y-1/2 w-56 h-56 z-20"
                  >
                    <img 
                      src={equippedItems.includes('tt2') ? "/tt2.png" : equippedItems.includes('bdd2') ? "/bdd2.gif" : "/item3.png"} 
                      alt="Health Regen" 
                      className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/40x40/22c55e/ffffff?text=HP";
                      }}
                    />
                  </motion.div>
                )}

                {/* Item 2 Visual Marker above player */}
                {(equippedItems.includes('item2') || equippedItems.includes('tt1') || equippedItems.includes('bdd1')) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-40 z-50 pointer-events-none"
                  >
                    <img 
                      src={equippedItems.includes('tt1') ? "/tt1.png" : equippedItems.includes('bdd1') ? "/bdd1.png" : "/item2.png"} 
                      alt="Health Increase" 
                      className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]" 
                      onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/128x128/333/fff?text=I2"}
                    />
                  </motion.div>
                )}
                <motion.div
                  animate={playerIsHit ? { 
                    filter: ['brightness(1)', 'brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(5)', 'brightness(1)'],
                    scale: [1, 1.05, 1],
                    x: [0, -5, 5, -5, 5, 0]
                  } : { 
                    filter: 'none',
                    scale: 1,
                    x: 0
                  }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <img 
                    src="/player.png" 
                    alt="Player Character" 
                    className="w-full h-auto drop-shadow-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/100x100/fff/000?text=Player";
                    }}
                  />
                </motion.div>
                {/* W Prompt Overlay above player when projectile is active */}
                {projectile?.active && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                    <div className="bg-white/90 text-black font-black px-4 py-2 rounded-xl border-4 border-black text-xl shadow-lg ring-2 ring-blue-400">W</div>
                  </div>
                )}
                {/* 2.5s GIF Overlay - Moved slightly higher above character */}
                {showGif && (
                  <div className="absolute inset-x-0 -top-20 z-20 flex items-center justify-center">
                    <img 
                      src="/haginba.gif" 
                      alt="Effect" 
                      className="w-full h-auto scale-125"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Square Buttons - Skill Q & Basic Attack G */}
            <div 
              className="absolute z-30 flex gap-4"
              style={{
                left: '22%',
                top: '85%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Skill Q button */}
              <button
                onClick={handleTriggerGif}
                className={`w-20 h-20 sm:w-28 sm:h-28 border-4 rounded-xl backdrop-blur-sm transition-all flex items-center justify-center group overflow-hidden relative cursor-pointer ${
                  cooldown > 0 
                    ? "bg-black/60 border-white/10" 
                    : "bg-white/5 border-white/30 hover:border-white/60"
                }`}
              >
                <img 
                  src="/gug.png" 
                  alt="Button Icon" 
                  className={`w-full h-full object-contain ${cooldown > 0 ? 'opacity-30 grayscale' : 'opacity-100'}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/100x100/fff/000?text=GUG";
                  }}
                />
                {cooldown > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-white font-black text-2xl sm:text-3xl drop-shadow-lg">{cooldown}</span>
                  </div>
                ) : (
                  <div className="absolute bottom-1 right-2">
                    <span className="text-white/50 text-[10px] font-bold">Q</span>
                  </div>
                )}
              </button>

              {/* Basic G button */}
              <button
                onClick={handleTriggerGibon}
                className={`w-20 h-20 sm:w-28 sm:h-28 border-4 rounded-xl backdrop-blur-sm transition-all flex items-center justify-center group overflow-hidden relative cursor-pointer ${
                  gibonCooldown > 0 
                    ? "bg-black/60 border-white/10" 
                    : "bg-white/5 border-white/30 hover:border-white/60"
                }`}
              >
                <img 
                  src="/gibon.png" 
                  alt="Basic Attack Icon" 
                  className={`w-full h-full object-contain ${gibonCooldown > 0 ? 'opacity-30 grayscale' : 'opacity-100'}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/100x100/fff/000?text=Gibon";
                  }}
                />
                {gibonCooldown > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-white font-black text-xl sm:text-2xl drop-shadow-lg">{(gibonCooldown/1000).toFixed(1)}</span>
                  </div>
                ) : (
                  <div className="absolute bottom-1 right-2">
                    <span className="text-white/50 text-[10px] font-bold">G</span>
                  </div>
                )}
              </button>
            </div>

            {/* Level Up Effect */}
            <AnimatePresence>
              {showLevelUpEffect && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -20, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1,
                      ease: "easeInOut" 
                    }}
                    className="flex flex-col items-center"
                  >
                    <h1 className="text-7xl sm:text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-amber-600 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)] filter brightness-125">
                      LEVEL UP!
                    </h1>
                    <div className="mt-4 px-8 py-2 bg-white/20 backdrop-blur-md rounded-full border-2 border-white/50 shadow-2xl flex flex-col items-center gap-1">
                      <span className="text-white text-2xl sm:text-4xl font-black italic tracking-tighter">
                        LEVEL {playerLevel} REACHED
                      </span>
                      {playerLevel >= 20 && (
                        <motion.span 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-yellow-300 text-sm sm:text-lg font-bold"
                        >
                          (이제 보스전을 할수 있습니다!)
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* Golden Flash Overlay */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.4, 0] }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-yellow-400 mix-blend-overlay"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chapter Clear Overlay */}
            <AnimatePresence>
              {showClear && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                >
                  <div className="flex flex-col items-center">
                    <motion.h2 
                      initial={{ y: 20 }}
                      animate={{ y: 0 }}
                      className="text-white text-8xl sm:text-[10rem] font-black italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] uppercase"
                    >
                      CLEAR!
                    </motion.h2>
                    <motion.div 
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.2 }}
                      className="h-2 w-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Over Overlay */}
            <AnimatePresence>
              {isDead && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="absolute inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-xl"
                >
                  <div className="bg-red-950/20 p-12 rounded-[3rem] border-4 border-red-500/50 flex flex-col items-center gap-8 shadow-[0_0_80px_rgba(239,68,68,0.4)]">
                    <h2 className="text-white text-7xl font-black italic tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">YOU DIED</h2>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={handleRetry}
                        className="px-10 py-5 bg-red-600 hover:bg-red-500 text-white font-black text-2xl rounded-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg uppercase border-b-8 border-red-800"
                      >
                        다시하기
                      </button>
                      {isInBossBattle && (
                        <button
                          onClick={handleGotoStages}
                          className="px-10 py-5 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-2xl rounded-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg uppercase border-b-8 border-zinc-950"
                        >
                          스테이지로
                        </button>
                      )}
                    </div>
                    
                    <p className="text-white/40 font-mono text-sm uppercase tracking-widest mt-2 animate-pulse">Press ENTER to retry</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pause Overlay */}
            <AnimatePresence>
              {isPaused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 20 }}
                    className="bg-blue-950/20 p-12 rounded-[3rem] border-4 border-blue-500/50 flex flex-col items-center gap-8 shadow-[0_0_80px_rgba(59,130,246,0.4)]"
                  >
                    <h2 className="text-white text-7xl font-black italic tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">일시정지</h2>
                    
                    <div className="flex flex-col gap-4 w-full">
                      <button
                        onClick={() => setIsPaused(false)}
                        className="group flex items-center justify-center gap-4 bg-blue-600 hover:bg-blue-50 text-white hover:text-blue-600 px-12 py-6 rounded-2xl font-black text-3xl shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer border-4 border-blue-400 uppercase"
                      >
                        <Play className="w-8 h-8 fill-current" />
                        <span>계속하기</span>
                      </button>
                      
                      {isInBossBattle && (
                        <button
                          onClick={handleGotoStages}
                          className="group flex items-center justify-center gap-4 bg-zinc-800 hover:bg-zinc-700 text-white px-12 py-6 rounded-2xl font-black text-3xl shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer border-4 border-zinc-600 uppercase"
                        >
                          <X className="w-8 h-8" />
                          <span>나가기</span>
                        </button>
                      )}
                    </div>
                    
                    <p className="text-white/40 font-mono text-sm uppercase tracking-widest mt-2 animate-pulse">Press ESC to resume</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

