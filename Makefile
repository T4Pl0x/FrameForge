.PHONY: gates-demo gates-green gates-red

# default demo: pass/warn/fail mix
gates-demo:
	mkdir -p .echo
	echo '{"tests":"ok","a11y":"warn","lintBuild":"fail","ts":"'"$$(date -Is)"'"}' > .echo/gate-summary.json
	@echo "Wrote .echo/gate-summary.json (demo)"

# all green
gates-green:
	mkdir -p .echo
	echo '{"tests":"ok","a11y":"ok","lintBuild":"ok","ts":"'"$$(date -Is)"'"}' > .echo/gate-summary.json
	@echo "Wrote .echo/gate-summary.json (green)"

# all red
gates-red:
	mkdir -p .echo
	echo '{"tests":"fail","a11y":"fail","lintBuild":"fail","ts":"'"$$(date -Is)"'"}' > .echo/gate-summary.json
	@echo "Wrote .echo/gate-summary.json (red)"

