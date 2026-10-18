"""DVC internals: executable mathematical teaching examples, in NCHW format.

Run:
    python dvc_internals.py --check
    python dvc_internals.py --steps 3

This is an untrained, small-width teaching model, not a pretrained DVC codec.
It estimates rate; it does not implement arithmetic coding or I-frame coding.
The data flow follows the linked PyTorch reimplementation, with these explicit
simplifications: softplus-positive GDN parameters, smaller channel counts,
softplus-positive hyperprior scales, modern explicit sampling conventions,
default random initialization, and synthetic inputs. Training uses the pure RD
objective, without the port's early auxiliary warp/prediction losses, and clips
gradient norm rather than clipping each gradient component. Checkpoints do not
match.

Primary references:
  https://arxiv.org/abs/1611.01704  (GDN, quantization relaxation)
  https://arxiv.org/abs/1611.00850  (SPyNet)
  https://arxiv.org/abs/1802.01436  (learned CDF and scale hyperprior)
  https://github.com/ZhihaoHu/PyTorchVideoCompression/tree/
      e9dafc2bccfa5d49f464e7b031f587a2225d3927/DVC

Cached upstream files and their MIT license are in reference/. This teaching
file is independent of their legacy TensorFlow, CUDA and torchac imports.
"""

from __future__ import annotations

import argparse
import json
import math

import torch
from torch import Tensor, nn
from torch.nn import functional as F


def inverse_softplus(value: Tensor) -> Tensor:
    """A stable inverse, used only to initialize positive parameters."""
    return value + torch.log(-torch.expm1(-value))


class GDN(nn.Module):
    """y_i = x_i / sqrt(beta_i + sum_j gamma_ij x_j**2).

    inverse=True implements learned IGDN, not an exact algebraic inverse.
    Softplus is a teaching parameterization; upstream uses square + LowerBound.
    Parameters operate across channels at the SAME spatial position.
    """

    def __init__(self, channels: int, inverse: bool = False):
        super().__init__()
        self.inverse = inverse
        beta = torch.ones(channels)
        gamma = 0.1 * torch.eye(channels) + 1e-6
        self.beta_raw = nn.Parameter(inverse_softplus(beta))
        self.gamma_raw = nn.Parameter(inverse_softplus(gamma))

    def forward(self, x: Tensor) -> Tensor:
        beta = F.softplus(self.beta_raw) + 1e-6
        gamma = F.softplus(self.gamma_raw)[:, :, None, None]
        denominator = F.conv2d(x.square(), gamma, bias=beta).sqrt()
        return x * denominator if self.inverse else x / denominator


def warp(reference: Tensor, flow: Tensor) -> Tensor:
    """Backward sampling: output[b,:,y,x] = reference[b,:,y+dy,x+dx].

    flow[:,0] is dx and flow[:,1] is dy, measured in reference pixel units.
    Positive dx samples to the right; it is not a rightward forward image shift.
    Bilinear interpolation is differentiable almost everywhere. Borders are
    replicated. The [-1,1] conversion below requires align_corners=True.
    """
    batch, _, height, width = reference.shape
    if flow.shape != (batch, 2, height, width):
        raise ValueError("flow must have shape B x 2 x H x W")
    if height < 2 or width < 2:
        raise ValueError("this teaching warp requires H,W >= 2")
    yy, xx = torch.meshgrid(
        torch.arange(height, device=reference.device, dtype=reference.dtype),
        torch.arange(width, device=reference.device, dtype=reference.dtype),
        indexing="ij",
    )
    gx = 2 * (xx[None] + flow[:, 0]) / (width - 1) - 1
    gy = 2 * (yy[None] + flow[:, 1]) / (height - 1) - 1
    grid = torch.stack((gx, gy), dim=-1)
    return F.grid_sample(
        reference, grid, mode="bilinear", padding_mode="border",
        align_corners=True,
    )


class FlowRefinement(nn.Sequential):
    """One SPyNet refinement: 3+3+2 input channels, two flow corrections."""

    def __init__(self):
        channels = (8, 32, 64, 32, 16, 2)
        layers = []
        for i, (source, target) in enumerate(zip(channels, channels[1:])):
            layers.append(nn.Conv2d(source, target, 7, padding=3))
            if i < 4:
                layers.append(nn.ReLU())
        super().__init__(*layers)


class PyramidFlow(nn.Module):
    """Four levels as in the DVC PyTorch port; original SPyNet used five."""

    def __init__(self, levels: int = 4):
        super().__init__()
        self.blocks = nn.ModuleList(FlowRefinement() for _ in range(levels))

    def forward(self, current: Tensor, reference: Tensor) -> Tensor:
        current_pyramid, reference_pyramid = [current], [reference]
        for _ in range(len(self.blocks) - 1):
            current_pyramid.append(F.avg_pool2d(current_pyramid[-1], 2))
            reference_pyramid.append(F.avg_pool2d(reference_pyramid[-1], 2))
        flow = None
        for block, image, ref in zip(
            self.blocks, reversed(current_pyramid), reversed(reference_pyramid)
        ):
            if flow is None:
                flow = image.new_zeros(image.shape[0], 2, *image.shape[-2:])
            else:
                old_h, old_w = flow.shape[-2:]
                new_h, new_w = image.shape[-2:]
                flow = F.interpolate(
                    flow, size=(new_h, new_w), mode="bilinear", align_corners=False
                )
                # Resizing the field also changes displacement units.
                scale = flow.new_tensor((new_w / old_w, new_h / old_h))
                flow = flow * scale.view(1, 2, 1, 1)
            features = torch.cat((image, warp(ref, flow), flow), dim=1)
            flow = flow + block(features)
        return flow


class MotionAnalysis(nn.Sequential):
    """Eight convolutions and LeakyReLU, following the PyTorch port."""

    def __init__(self, channels: int):
        layers = []
        for level in range(4):
            layers.extend((
                nn.Conv2d(2 if level == 0 else channels, channels, 3, 2, 1),
                nn.LeakyReLU(0.1),
                nn.Conv2d(channels, channels, 3, 1, 1),
            ))
            if level < 3:
                layers.append(nn.LeakyReLU(0.1))
        super().__init__(*layers)


class MotionSynthesis(nn.Sequential):
    def __init__(self, channels: int):
        layers = []
        for level in range(4):
            layers.extend((
                nn.ConvTranspose2d(channels, channels, 3, 2, 1, output_padding=1),
                nn.LeakyReLU(0.1),
                nn.Conv2d(channels, 2 if level == 3 else channels, 3, 1, 1),
            ))
            if level < 3:
                layers.append(nn.LeakyReLU(0.1))
        super().__init__(*layers)


class ResidualAnalysis(nn.Sequential):
    def __init__(self, channels: int, latent_channels: int):
        layers = []
        for level in range(4):
            target = latent_channels if level == 3 else channels
            layers.append(nn.Conv2d(3 if level == 0 else channels, target, 5, 2, 2))
            if level < 3:
                layers.append(GDN(channels))
        super().__init__(*layers)


class ResidualSynthesis(nn.Sequential):
    def __init__(self, channels: int, latent_channels: int):
        layers = []
        for level in range(4):
            layers.append(nn.ConvTranspose2d(
                latent_channels if level == 0 else channels,
                3 if level == 3 else channels, 5, 2, 2, output_padding=1,
            ))
            if level < 3:
                layers.append(GDN(channels, inverse=True))
        super().__init__(*layers)


class PreActivationBlock(nn.Module):
    def __init__(self, channels: int):
        super().__init__()
        self.body = nn.Sequential(
            nn.ReLU(), nn.Conv2d(channels, channels, 3, padding=1),
            nn.ReLU(), nn.Conv2d(channels, channels, 3, padding=1),
        )

    def forward(self, x: Tensor) -> Tensor:
        return x + self.body(x)


class MotionCompensation(nn.Module):
    """Six-channel port variant: warped reference plus reference, not flow."""

    def __init__(self, channels: int):
        super().__init__()
        self.stem = nn.Sequential(nn.Conv2d(6, channels, 3, padding=1), nn.ReLU())
        self.blocks = nn.ModuleList(PreActivationBlock(channels) for _ in range(6))
        self.head = nn.Conv2d(channels, 3, 3, padding=1)

    def forward(self, reference: Tensor, decoded_flow: Tensor) -> tuple[Tensor, Tensor]:
        warped = warp(reference, decoded_flow)
        x0 = self.blocks[0](self.stem(torch.cat((warped, reference), 1)))
        x1 = self.blocks[1](F.avg_pool2d(x0, 2))
        x2 = self.blocks[3](self.blocks[2](F.avg_pool2d(x1, 2)))
        x3 = self.blocks[4](x1 + F.interpolate(
            x2, size=x1.shape[-2:], mode="bilinear", align_corners=True
        ))
        x4 = self.blocks[5](x0 + F.interpolate(
            x3, size=x0.shape[-2:], mode="bilinear", align_corners=True
        ))
        return warped + self.head(x4), warped


class MonotoneLayer(nn.Module):
    def __init__(self, channels: int, final: bool = False):
        super().__init__()
        self.final = final
        self.h = nn.Parameter(torch.zeros(1, channels, 1, 1))
        self.b = nn.Parameter(torch.zeros(1, channels, 1, 1))
        self.a = None if final else nn.Parameter(torch.zeros(1, channels, 1, 1))

    def forward(self, x: Tensor) -> Tensor:
        u = x * F.softplus(self.h) + self.b
        if self.final:
            return u.sigmoid()
        return u + torch.tanh(self.a) * torch.tanh(u)


class FactorizedCDF(nn.Sequential):
    """Per-channel learned cumulative, shared over spatial positions.

    The forward output is a CDF, not a probability mass and not a bit count.
    Positive slopes + constrained residual nonlinearity preserve monotonicity.
    """

    def __init__(self, channels: int):
        super().__init__(
            MonotoneLayer(channels), MonotoneLayer(channels),
            MonotoneLayer(channels), MonotoneLayer(channels, final=True),
        )

    def likelihood(self, symbols: Tensor) -> Tensor:
        return self(symbols + 0.5) - self(symbols - 0.5)


def laplace_mass(symbols: Tensor, scale: Tensor) -> Tensor:
    """Probability of a unit quantization bin, not density at its center.

    Stable branch form of F(k+0.5)-F(k-0.5), avoiding cancellation in the tails.
    For Laplace(0,b), standard deviation is sqrt(2)*b; scale here is b.
    """
    scale = scale.clamp_min(1e-6)
    absolute = symbols.abs()
    lower = (absolute - 0.5) / scale
    upper = (absolute + 0.5) / scale
    tail_mass = 0.5 * torch.exp(-lower.clamp_min(0)) * (-torch.expm1(-1 / scale))
    central_mass = -0.5 * (
        torch.expm1(lower.clamp_max(0)) + torch.expm1(-upper)
    )
    return torch.where(lower >= 0, tail_mass, central_mass)


def estimated_bits(likelihood: Tensor) -> Tensor:
    """The floor is a numerical safeguard for the log, not an entropy coder."""
    return -torch.log2(likelihood.clamp_min(1e-9)).sum()


def quantize(x: Tensor, training: bool) -> Tensor:
    if training:
        return x + torch.empty_like(x).uniform_(-0.5, 0.5)
    return x.round()


class MiniDVC(nn.Module):
    """Small, untrained data-flow model with m, y and hyperlatent z."""

    def __init__(self, n: int = 16, m: int = 24, motion_channels: int = 16):
        super().__init__()
        self.flow = PyramidFlow()
        self.motion_encoder = MotionAnalysis(motion_channels)
        self.motion_decoder = MotionSynthesis(motion_channels)
        self.compensation = MotionCompensation(n)
        self.residual_encoder = ResidualAnalysis(n, m)
        self.residual_decoder = ResidualSynthesis(n, m)
        self.hyper_encoder = nn.Sequential(
            nn.Conv2d(m, n, 3, padding=1), nn.ReLU(),
            nn.Conv2d(n, n, 5, 2, 2), nn.ReLU(),
            nn.Conv2d(n, n, 5, 2, 2),
        )
        self.hyper_decoder = nn.Sequential(
            nn.ConvTranspose2d(n, n, 5, 2, 2, output_padding=1), nn.ReLU(),
            nn.ConvTranspose2d(n, n, 5, 2, 2, output_padding=1), nn.ReLU(),
            nn.Conv2d(n, m, 3, padding=1),
        )
        self.motion_cdf = FactorizedCDF(motion_channels)
        self.hyper_cdf = FactorizedCDF(n)

    def predict(self, reference: Tensor, m_hat: Tensor) -> tuple[Tensor, Tensor]:
        return self.compensation(reference, self.motion_decoder(m_hat))

    def decode_latents(self, reference: Tensor, m_hat: Tensor, y_hat: Tensor) -> Tensor:
        """Neural reconstruction ONLY. Symbol entropy decoding happens earlier.

        z_hat is required to entropy-decode y_hat, but is no longer needed once
        y_hat is available. This function does not implement that entropy step.
        """
        prediction, _ = self.predict(reference, m_hat)
        return (prediction + self.residual_decoder(y_hat)).clamp(0, 1)

    def forward(self, current: Tensor, reference: Tensor) -> dict[str, Tensor]:
        if current.ndim != 4 or current.shape != reference.shape or current.shape[1] != 3:
            raise ValueError("current/reference must have equal B x 3 x H x W shapes")
        if any(size < 64 or size % 64 for size in current.shape[-2:]):
            raise ValueError("this teaching model requires H,W to be positive multiples of 64")

        flow = self.flow(current, reference)
        m_hat = quantize(self.motion_encoder(flow), self.training)
        prediction, warped = self.predict(reference, m_hat)
        residual = current - prediction
        y = self.residual_encoder(residual)
        z = self.hyper_encoder(y.abs())
        z_hat = quantize(z, self.training)
        scale = F.softplus(self.hyper_decoder(z_hat)) + 1e-4
        y_hat = quantize(y, self.training)
        reconstruction = prediction + self.residual_decoder(y_hat)

        pixels = current.shape[0] * current.shape[2] * current.shape[3]
        rate_m = estimated_bits(self.motion_cdf.likelihood(m_hat)) / pixels
        rate_z = estimated_bits(self.hyper_cdf.likelihood(z_hat)) / pixels
        rate_y = estimated_bits(laplace_mass(y_hat, scale)) / pixels
        return {
            "reconstruction": reconstruction.clamp(0, 1),
            "mse": F.mse_loss(reconstruction, current),
            "warp_mse": F.mse_loss(warped, current),
            "prediction_mse": F.mse_loss(prediction, current),
            "bpp_m": rate_m, "bpp_z": rate_z, "bpp_y": rate_y,
            "bpp": rate_m + rate_z + rate_y,
            "m_hat": m_hat, "z_hat": z_hat, "y_hat": y_hat,
            "scale": scale,
        }


def synthetic_pair() -> tuple[Tensor, Tensor]:
    """A known horizontal shift and a newly appearing small region."""
    yy, xx = torch.meshgrid(torch.linspace(0, 1, 64), torch.linspace(0, 1, 64), indexing="ij")
    reference = torch.stack((xx, yy, 0.5 * (xx + yy)))[None]
    current = torch.cat((reference[..., :1].expand(-1, -1, -1, 2), reference[..., :-2]), -1)
    current = current.clone()
    current[..., 24:32, 28:36] = 0.9
    return current, reference


def self_check() -> dict[str, object]:
    """Numerical contracts, including independent derivatives and decoding."""
    torch.manual_seed(7)
    results: dict[str, object] = {}

    # An analytical GDN input Jacobian checks channel ordering and x**2.
    gdn = GDN(2).double()
    x = torch.tensor([[[[1.2]], [[-0.7]]]], dtype=torch.float64, requires_grad=True)
    actual = torch.autograd.functional.jacobian(gdn, x).reshape(2, 2)
    gamma = F.softplus(gdn.gamma_raw)
    beta = F.softplus(gdn.beta_raw) + 1e-6
    vector = x.reshape(2)
    s = beta + gamma @ vector.square()
    expected = torch.diag(s.rsqrt()) - vector[:, None] * gamma * vector[None, :] * s[:, None].pow(-1.5)
    torch.testing.assert_close(actual, expected, atol=1e-10, rtol=1e-9)
    results["gdn_jacobian_max_error"] = float((actual - expected).abs().max().detach())

    # Half-pixel interpolation on a linear ramp has an exact known answer.
    ramp = torch.arange(7, dtype=torch.float64).view(1, 1, 1, 7).expand(1, 1, 5, 7)
    displacement = torch.zeros(1, 2, 5, 7, dtype=torch.float64)
    displacement[:, 0] = 0.5
    displacement.requires_grad_()
    warped = warp(ramp, displacement)
    torch.testing.assert_close(warped[..., :-1], ramp[..., :-1] + 0.5)
    torch.testing.assert_close(warped[..., -1], ramp[..., -1])
    derivative = torch.autograd.grad(warped[0, 0, 2, 2], displacement)[0]
    torch.testing.assert_close(derivative[0, 0, 2, 2], torch.tensor(1.0, dtype=torch.float64))
    results["warp_half_pixel_and_gradient"] = True

    # CDFs must be monotone, reach 0/1 in the tails, and bin masses sum to one.
    cdf = FactorizedCDF(2).double()
    grid = torch.linspace(-200, 200, 2001, dtype=torch.float64).view(1, 1, 1, -1).expand(1, 2, 1, -1)
    cumulative = cdf(grid)
    assert bool((cumulative[..., 1:] >= cumulative[..., :-1]).all())
    torch.testing.assert_close(cumulative[..., 0], torch.zeros(1, 2, 1, dtype=torch.float64), atol=1e-12, rtol=0)
    torch.testing.assert_close(cumulative[..., -1], torch.ones(1, 2, 1, dtype=torch.float64), atol=1e-12, rtol=0)
    integers = torch.arange(-200, 201, dtype=torch.float64).view(1, 1, 1, -1).expand(1, 2, 1, -1)
    torch.testing.assert_close(cdf.likelihood(integers).sum(-1), torch.ones(1, 2, 1, dtype=torch.float64))
    results["cdf_monotone_and_normalized"] = True

    # Compare stable Laplace bin masses against PyTorch's separate distribution.
    symbols = torch.tensor([-4.0, -0.2, 0.0, 0.3, 3.0], dtype=torch.float64)
    scale = torch.tensor([0.8, 0.3, 1.0, 2.0, 3.0], dtype=torch.float64)
    distribution = torch.distributions.Laplace(torch.zeros_like(scale), scale)
    expected_mass = distribution.cdf(symbols + 0.5) - distribution.cdf(symbols - 0.5)
    torch.testing.assert_close(laplace_mass(symbols, scale), expected_mass, atol=1e-12, rtol=1e-10)
    integer_bins = torch.arange(-200, 201, dtype=torch.float64)
    torch.testing.assert_close(laplace_mass(integer_bins, torch.tensor(1.0)).sum(), torch.tensor(1.0, dtype=torch.float64))
    results["laplace_bin_integral"] = True

    # Verify all component groups receive RD gradients; this is not a quality test.
    model = MiniDVC()
    current, reference = synthetic_pair()
    model.train()
    out = model(current, reference)
    loss = 256 * out["mse"] + out["bpp"]
    loss.backward()
    groups = ["flow", "motion_encoder", "motion_decoder", "compensation",
              "residual_encoder", "residual_decoder", "hyper_encoder", "hyper_decoder",
              "motion_cdf", "hyper_cdf"]
    gradients = {}
    for name in groups:
        parameters = list(getattr(model, name).parameters())
        assert all(p.grad is not None and bool(torch.isfinite(p.grad).all()) for p in parameters), name
        magnitude = sum(float(p.grad.abs().sum()) for p in parameters)
        assert magnitude > 0, name
        gradients[name] = magnitude
    assert bool(torch.isfinite(loss))
    results["rd_gradients_reach_all_modules"] = gradients

    model.eval()
    with torch.no_grad():
        out = model(current, reference)
        torch.testing.assert_close(out["bpp"], out["bpp_m"] + out["bpp_z"] + out["bpp_y"])
        for name in ["m_hat", "z_hat", "y_hat"]:
            torch.testing.assert_close(out[name], out[name].round())
        decoded = model.decode_latents(reference, out["m_hat"], out["y_hat"])
        torch.testing.assert_close(decoded, out["reconstruction"])
    results["eval_integer_latents_and_matching_neural_decoder"] = True
    results["latent_shapes"] = {name: list(out[name].shape) for name in ["m_hat", "z_hat", "y_hat"]}
    results["scope"] = "Untrained synthetic mathematical checks; no compression benchmark or bitstream."
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="run numerical and gradient checks")
    parser.add_argument("--steps", type=int, default=0, help="synthetic training steps, no dataset download")
    args = parser.parse_args()
    torch.set_num_threads(2)
    if args.check:
        print(json.dumps(self_check(), indent=2))
    if args.steps > 0:
        torch.manual_seed(11)
        model = MiniDVC().train()
        optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
        current, reference = synthetic_pair()
        print("UNTRAINED synthetic teaching run; rate is an estimate, not file size.")
        for step in range(args.steps):
            out = model(current, reference)
            loss = 256 * out["mse"] + out["bpp"]
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            metrics = {name: float(out[name].detach()) for name in ["mse", "bpp_m", "bpp_z", "bpp_y", "bpp"]}
            print(json.dumps({"step": step + 1, "loss": float(loss.detach()), **metrics}))
    if not args.check and args.steps <= 0:
        parser.print_help()


if __name__ == "__main__":
    main()
